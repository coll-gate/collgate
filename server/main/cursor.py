# -*- coding: utf-8; -*-
#
# @file cursor.py
# @brief Cursor based pagination, search and filter.
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2016-09-01
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details

import re
import datetime

from django.contrib.postgres.fields import JSONField, ArrayField
from django.db import models, ProgrammingError, connection
from django.db.models import prefetch_related_objects
from django.db.models.fields.related_descriptors import ForwardManyToOneDescriptor

from django.utils import translation


class CursorQueryError(Exception):
    def __init__(self, message):
        super(Exception, self).__init__(message)


class CursorQueryValueError(CursorQueryError):
    def __init__(self, message):
        super(Exception, self).__init__("Value error: " + message)


class CursorQueryOperatorError(CursorQueryError):
    def __init__(self, message):
        super(Exception, self).__init__("Operator error: " + message)


class CursorField(object):
    """
    Internal cursor field helper.
    """

    FIELD_TYPE_DEFAULT = 0
    FIELD_TYPE_DESCRIPTOR = 1
    FIELD_TYPE_COUNT = 2
    FIELD_TYPE_LABEL = 3
    FIELD_TYPE_FORMAT = 4
    FIELD_TYPE_SYNONYM = 5

    def __init__(self, field, index, cursor_query):
        self._name = field.lstrip('+-#@$&')
        self._index = index

        if field[0] == '#' or field[1] == '#':
            self._type = CursorField.FIELD_TYPE_DESCRIPTOR
        elif field[0] == '@' or field[1] == '@':
            self._type = CursorField.FIELD_TYPE_LABEL
        elif field[0] == '$' or field[1] == '$':
            self._type = CursorField.FIELD_TYPE_FORMAT
        elif field[0] == '&' or field[1] == '&':
            self._type = CursorField.FIELD_TYPE_SYNONYM
        elif self.name in cursor_query.count_fields():
            self._type = CursorField.FIELD_TYPE_COUNT
        else:
            self._type = CursorField.FIELD_TYPE_DEFAULT

        self._op = '<' if field[0] == '-' else '>'
        self._ope = '<=' if field[0] == '-' else '>='

        self._synonym_type = None

    @property
    def name(self):
        return self._name

    @property
    def index(self):
        return self._index

    @property
    def is_synonym(self):
        return self._type == CursorField.FIELD_TYPE_SYNONYM

    def synonym_type(self):
        if self.is_synonym and self._synonym_type is None:
            from main.models import EntitySynonymType
            self._synonym_type = EntitySynonymType.objects.get(name=self.name)
        return self._synonym_type

    @property
    def is_multiple_synonym(self):
        return self.synonym_type().multiple_entry

    @property
    def is_descriptor(self):
        return self._type == CursorField.FIELD_TYPE_DESCRIPTOR

    @property
    def is_count(self):
        return self._type == CursorField.FIELD_TYPE_COUNT

    @property
    def is_label(self):
        return self._type == CursorField.FIELD_TYPE_LABEL

    @property
    def is_format(self):
        return self._type == CursorField.FIELD_TYPE_FORMAT

    @property
    def sub_name(self):
        if self.is_label:
            return translation.get_language()
        else:
            return None

    @property
    def exclusive_operator(self):
        return self._op

    @property
    def inclusive_operator(self):
        return self._ope


class CursorQuery(object):
    """
    Cursor query is the main object to handle complex queries onto any object based on describable.
    It allow to sort and process the pagination with a cursor:limit, and allow complex filters.
    It is like the Django query object but with some extension about support of JSONB fields.

    The field "descriptors" is supported using a prefix # plus the name of its descriptor code (key).
    Joins are done automatically when necessary.

    Descriptor format type objects and models are used to performs the correct SQL queries.

    So this is the way to use for make queries.
    """

    FIELDS_SEP = "->"

    # need to escape % because of django raw
    OPERATORS_MAP = {
        'in': 'IN',
        'notin': 'NOT IN',
        'isnull': '=',
        'notnull': '!=',
        '=': '=',
        'eq': '=',
        '!=': '!=',
        'neq': '!=',
        'gte': '>=',
        'gt': '>',
        'lte': '<=',
        'lt': '<',
        'exact': 'LIKE',
        'iexact': 'ILIKE',
        'contains': 'LIKE',
        'icontains': 'ILIKE',
        'startswith': 'LIKE',
        'istartswith': 'ILIKE',
        'endswith': 'LIKE',
        'iendswith': 'ILIKE'
    }

    MULTI_SYNONYM_OPERATORS_MAP = {
        'isnull': '=',
        'notnull': '!=',
        '=': '@>',
        'eq': '@>',
        '!=': 'NOT @>',
        'neq': 'NOT @>',
        'contains': 'LIKE',
        'icontains': 'ILIKE',
    }

    ARRAY_OPERATORS_MAP = {
        'in': '@>',
        'contains': '@>',
        'contained_by': '<@',
        'notin': ['NOT', '@>'],
        'not_contains': ['NOT', '@>'],
        'not_contained_by': ['NOT', '<@'],
        'overlap': '&&',
        'not_overlap': ['NOT', '&&'],
    }

    def __init__(self, model, db='default'):
        self._model = model

        self._synonym_model = None
        self._synonym_table_aliases = {}

        self._query_set = None
        self._order_by = ('id',)
        self._cursor = None
        self._cursor_fields = None
        self._description = None

        self._cursor_built = False
        self._prev_cursor = None
        self._next_cursor = None

        self.query_select = []
        self.query_distinct = None
        self.query_from = ['"%s"' % model._meta.db_table]
        self.query_filters = []
        self.query_where = []
        self.query_order_by = []
        self.query_group_by = []
        self.query_limit = None

        self._related_tables = {}

        self._select_related = False
        self._prefetch_related = []
        self._counts = []

        self._filter_clauses = []

        db_table = model._meta.db_table

        self.sub_query_select = ['"%s".*' % db_table]
        self._sub_query_array_fields = {}

        self.model_fields = {}

        from descriptor.descriptorcolumns import get_description
        self._description = get_description(self._model)

        for field in model._meta.get_fields():
            if type(field) is models.fields.related.OneToOneRel:
                self.model_fields[field.name] = ('O2O', '', field.null)
            elif type(field) is models.fields.reverse_related.ManyToManyRel:
                self.model_fields[field.name] = ('M2M', '', field.null)
            elif type(field) is models.fields.reverse_related.ManyToOneRel:
                self.model_fields[field.name] = ('M2O', 'INTEGER', field.null)
            elif type(field) is models.fields.related.ManyToManyField:
                self.model_fields[field.name] = ('M2M', '', field.null)
            elif type(field) is models.fields.related.ForeignKey:
                self.model_fields[field.name] = ('FK', 'INTEGER', field.null)
                self.query_select.append('"%s"."%s_id"' % (db_table, field.name))
            elif type(field) is models.fields.IntegerField or type(field) == models.fields.AutoField:
                self.model_fields[field.name] = ('INTEGER', 'INTEGER', field.null)
                self.query_select.append('"%s"."%s"' % (db_table, field.name))
            elif type(field) is models.fields.DateTimeField:
                self.model_fields[field.name] = ('DATETIME', 'DATETIME', field.null)
                self.query_select.append('"%s"."%s"' % (db_table, field.name))
            elif type(field) is JSONField:
                self.model_fields[field.name] = ('JSON', 'JSON', field.null)
                self.query_select.append('"%s"."%s"' % (db_table, field.name))
            elif type(field) is models.fields.BooleanField:
                self.model_fields[field.name] = ('BOOL', 'BOOL', field.null)
                self.query_select.append('"%s"."%s"' % (db_table, field.name))
            elif type(field) is ArrayField:
                if type(field.base_field) is models.fields.IntegerField or type(
                        field.base_field) == models.fields.AutoField:
                    base_type = 'INTEGER'
                else:
                    base_type = 'TEXT'

                self.model_fields[field.name] = ('ARRAY', base_type, field.null)
                self.query_select.append('"%s"."%s"' % (db_table, field.name))
            else:
                self.model_fields[field.name] = ('TEXT', 'TEXT', field.null)
                self.query_select.append('"%s"."%s"' % (db_table, field.name))

    def get_model(self):
        return self._model

    def count_fields(self):
        return self._counts

    def cursor(self, cursor, cursor_fields=('id',)):
        """
        Defines the cursor at the previous latest element in way to get the next elements.

        :param cursor: Next cursor from the latest query set or None for starting.
        :param cursor_fields: Ordered name of the fields of the cursor.
        :return: self
        """
        self._cursor = cursor
        self._cursor_fields = cursor_fields

        select_related = []

        for field in cursor_fields:
            cf = CursorField(field, -1, self)

            if cf.is_descriptor:
                # only if sub-value of descriptor
                if self.FIELDS_SEP in cf.name:
                    select_related.append('#' + cf.name)
            elif cf.name in self.model_fields:
                ff = cf.name.split(self.FIELDS_SEP)

                if ff[0] in self.model_fields:
                    if self.model_fields[ff[0]][0] == 'FK':
                        select_related.append(cf.name)

        self.add_select_related(select_related)
        return self

    def _process_cursor(self):
        db_table = self._model._meta.db_table

        if self._cursor:
            _where = []
            previous = []
            i = 0

            for field in self._cursor_fields:
                cf = CursorField(field, i, self)

                if cf.is_count:
                    continue

                lqs = []

                if len(previous):
                    for prev_cf in previous:
                        # if self._cursor[prev_cf.index] is None:
                        #    continue

                        if prev_cf.is_descriptor:
                            if self.FIELDS_SEP in prev_cf.name:
                                pff = prev_cf.name.split(self.FIELDS_SEP)
                                lqs.append(
                                    self._cast_descriptor_sub_type(pff[0],
                                                                   pff[1],
                                                                   prev_cf.inclusive_operator,
                                                                   self._cursor[prev_cf.index]))
                            else:
                                clause = self._cast_descriptor_type(db_table,
                                                                    prev_cf.name,
                                                                    prev_cf.inclusive_operator,
                                                                    self._cursor[prev_cf.index])
                                if clause:
                                    lqs.append(clause)

                        elif prev_cf.is_synonym:
                            synonym_db_table = self._synonym_model._meta.db_table
                            alias = prev_cf.name + "_" + synonym_db_table
                            lqs.append(
                                self._cast_synonym_type(alias, prev_cf.inclusive_operator, self._cursor[prev_cf.index]))
                            # lqs.append('"%s"."%s" %s %s' % (alias, 'name', prev_cf.inclusive_operator, final_value))

                        else:
                            if self.FIELDS_SEP in prev_cf.name:
                                pff = prev_cf.name.split(self.FIELDS_SEP)
                                lqs.append(self._cast_default_sub_type(pff[0],
                                                                       pff[1],
                                                                       prev_cf.inclusive_operator,
                                                                       self._cursor[prev_cf.index]))
                            else:
                                lqs.append(
                                    self._cast_default_type(db_table,
                                                            prev_cf.name,
                                                            prev_cf.inclusive_operator,
                                                            self._cursor[prev_cf.index],
                                                            prev_cf.sub_name))

                    if cf.is_descriptor:
                        if self.FIELDS_SEP in cf.name:
                            ff = cf.name.split(self.FIELDS_SEP)
                            lqs.append(self._cast_descriptor_sub_type(ff[0],
                                                                      ff[1],
                                                                      cf.exclusive_operator,
                                                                      self._cursor[cf.index]))
                        else:
                            clause = self._cast_descriptor_type(db_table,
                                                                cf.name,
                                                                cf.exclusive_operator,
                                                                self._cursor[cf.index])
                            if clause:
                                lqs.append(clause)

                    elif cf.is_synonym:
                        synonym_db_table = self._synonym_model._meta.db_table
                        alias = cf.name + "_" + synonym_db_table
                        lqs.append(self._cast_synonym_type(alias, cf.exclusive_operator, self._cursor[cf.index]))

                    else:
                        if self.FIELDS_SEP in cf.name:
                            ff = cf.name.split(self.FIELDS_SEP)
                            lqs.append(self._cast_default_sub_type(ff[0],
                                                                   ff[1],
                                                                   cf.exclusive_operator,
                                                                   self._cursor[cf.index]))
                        else:
                            lqs.append(self._cast_default_type(db_table,
                                                               cf.name,
                                                               cf.exclusive_operator,
                                                               self._cursor[cf.index],
                                                               cf.sub_name))

                    # if self._cursor[i] is not None:
                    if len(lqs):
                        _where.append("(%s)" % " AND ".join(lqs))
                else:
                    if cf.is_descriptor:
                        if self.FIELDS_SEP in cf.name:
                            ff = cf.name.split(self.FIELDS_SEP)
                            lqs.append(self._cast_descriptor_sub_type(ff[0],
                                                                      ff[1],
                                                                      cf.exclusive_operator,
                                                                      self._cursor[cf.index]))
                        else:
                            clause = self._cast_descriptor_type(db_table,
                                                                cf.name,
                                                                cf.exclusive_operator,
                                                                self._cursor[cf.index])
                            if clause:
                                lqs.append(clause)

                    elif cf.is_synonym:
                        synonym_db_table = self._synonym_model._meta.db_table
                        alias = cf.name + "_" + synonym_db_table
                        lqs.append(self._cast_synonym_type(alias, cf.exclusive_operator, self._cursor[cf.index]))
                    else:
                        if self.FIELDS_SEP in cf.name:
                            ff = cf.name.split(self.FIELDS_SEP)
                            lqs.append(self._cast_default_sub_type(ff[0],
                                                                   ff[1],
                                                                   cf.exclusive_operator,
                                                                   self._cursor[cf.index]))
                        else:
                            lqs.append(self._cast_default_type(db_table,
                                                               cf.name,
                                                               cf.exclusive_operator,
                                                               self._cursor[cf.index],
                                                               cf.sub_name))

                    # if self._cursor[i] is not None:
                    if len(lqs):
                        _where.append("(%s)" % " AND ".join(lqs))

                previous.append(cf)

                i += 1

            if len(_where):
                self.query_filters.append(" OR ".join(_where))

    def _make_value(self, value, field_data):
        if value is None:
            if field_data[1] == 'INTEGER':
                if field_data[2]:
                    return "0"
                else:
                    return "NULL"
            elif field_data[1] == 'DATETIME':
                if field_data[2]:
                    return "'1900-01-01 00:00:00'::timestamp"
                else:
                    return "NULL"
            elif field_data[1] == 'BOOL':
                if field_data[2]:
                    return "FALSE"
                else:
                    return "NULL"
            else:
                if field_data[2]:
                    return "''"
                else:
                    return "NULL"

        if field_data[1] == 'INTEGER':
            if isinstance(value, int):
                return str(value)
            elif isinstance(value, list):
                try:
                    if field_data[0] == 'ARRAY':
                        return 'ARRAY[' + ','.join(str(int(v)) for v in value) + ']'
                    else:
                        return '(' + ','.join(str(int(v)) for v in value) + ')'
                except ValueError:
                    pass

            if field_data[2]:
                return "0"
            else:
                return "NULL"
        elif field_data[1] == 'DATETIME':
            dt = datetime.datetime.strptime(value.replace("'", "''"), '%Y-%m-%d %H:%M:%S')
            return "'" + dt.strftime('%Y-%m-%d %H:%M:%S') + "'::timestamp"
        elif field_data[1] == 'BOOL':
            return "TRUE" if value else "FALSE"
        else:
            return "'" + value.replace("'", "''") + "'"

    def _convert_value(self, value, cmp):
        # adjust value in some cases
        if cmp in ('isnull', 'notnull'):
            return 'NULL'
        elif cmp in ('contains', 'icontains') and not isinstance(value, list):
            return "%%" + value + "%%"
        elif cmp in ('startswith', 'istartswith'):
            return value + "%%"
        elif cmp in ('endswith', 'iendswith'):
            return "%%" + value
        else:
            return value

    def _convert_multi_synonym_value(self, value, cmp):
        # adjust value in some cases
        if cmp in ('isnull', 'notnull'):
            return "'{}'"
        elif cmp in ('contains', 'icontains') and not isinstance(value, list):
            return "%%" + value + "%%"
        elif cmp in ('startswith', 'istartswith'):
            return value + "%%"
        elif cmp in ('endswith', 'iendswith'):
            return "%%" + value
        else:
            return value

    def order_by(self, *args):
        """
        Defines the order by fields. The order of the field is important.
        Prefix by + or - for ordering ASC or DESC. Default is + when it is not defined.
        Prefix the name by # when it is a descriptor field. The -> separator permit
        to order by sub-fields (@see cursor).

        :param args: Array-s or string-s objects.
        :return: self
        """
        self._order_by = []

        for arg in args:
            if type(arg) == tuple or type(arg) == list:
                self._order_by.extend(arg)
            else:
                self._order_by.append(arg)

        # at least order by id
        if not self._order_by:
            self._order_by = ('id',)

        select_related = []

        for field in self._order_by:
            cf = CursorField(field, -1, self)

            if cf.is_descriptor:
                # only if sub-value of descriptor
                if self.FIELDS_SEP in cf.name:
                    select_related.append('#' + cf.name)
            else:
                if self.FIELDS_SEP in cf.name:
                    ff = cf.name.split(self.FIELDS_SEP)

                    if ff[0] in self.model_fields:
                        if self.model_fields[ff[0]][0] == 'FK':
                            select_related.append(cf.name)

        self.add_select_related(select_related)
        return self

    def _process_order_by(self):
        db_table = self._model._meta.db_table
        model_name = self._model._meta.model_name
        lang = translation.get_language()

        for field in self._order_by:
            cf = CursorField(field, -1, self)
            order = "DESC NULLS LAST" if field[0] == '-' else "ASC NULLS FIRST"

            if self.FIELDS_SEP in cf.name:
                ff = cf.name.split(self.FIELDS_SEP)

                if cf.is_descriptor:
                    renamed_table = "descr_" + ff[0].replace('.', '_')
                    related_model, related_fields = self._related_tables[renamed_table]

                    cast_type = related_fields[ff[1]][1]
                else:
                    cast_type = self.model_fields[ff[0]][1]
            else:
                if cf.is_descriptor:
                    description = self._description[cf.name]
                    cast_type = description['handler'].data
                elif cf.is_count:
                    cast_type = 'INTEGER'
                elif cf.is_label or cf.is_synonym:
                    cast_type = "TEXT"
                else:
                    cast_type = self.model_fields[cf.name][1]

            if cf.is_descriptor:
                if self.FIELDS_SEP in cf.name:
                    ff = cf.name.split(self.FIELDS_SEP)
                    renamed_table = "descr_" + ff[0].replace('.', '_')
                    self.query_order_by.append('"%s"."%s" %s' % (renamed_table, ff[1], order))
                else:
                    if cast_type != 'TEXT':
                        self.query_order_by.append('CAST("%s"."descriptors"->>\'%s\' as %s) %s' % (
                            db_table, cf.name, cast_type, order))
                    else:
                        self.query_order_by.append('("%s"."descriptors"->>\'%s\') %s' % (db_table, cf.name, order))
            else:
                if self.FIELDS_SEP in cf.name:
                    ff = cf.name.split(self.FIELDS_SEP)
                    self.query_order_by.append('"%s" %s' % ("_".join(ff), order))
                elif cf.is_synonym:

                    if not self._synonym_model:
                        raise CursorQueryError(
                            'Synonym model is not define, use CursorQuery.set_synonym_model() method')
                    elif cf.name not in self._synonym_table_aliases:
                        self.join_synonym(cf)

                    alias = self._synonym_table_aliases[cf.name]
                    self.query_order_by.append('"%s"."name" %s' % (alias, order))
                elif self.model_fields[cf.name][0] == 'FK':
                    self.query_order_by.append('"%s"."%s_id" %s' % (db_table, cf.name, order))
                elif cf.is_label:
                    self.query_order_by.append('"%s"."%s"->>\'%s\' %s' % (db_table, cf.name, lang, order))
                # count field
                elif cf.is_count:
                    # take column name depending of the relation
                    related_model = getattr(self._model, cf.name)
                    if type(related_model) is models.fields.related_descriptors.ManyToManyDescriptor:
                        column = getattr(related_model.through, model_name).field.column
                    else:
                        column = related_model.rel.field.column

                    self.query_order_by.append('"%s__count" %s' % (cf.name, order))
                    self.query_group_by.append('"%s"."%s"' % (cf.name, column))
                else:
                    self.query_order_by.append('"%s"."%s" %s' % (db_table, cf.name, order))

        return self

    @property
    def query_set(self):
        return self._query_set

    def _build_cursor(self):
        if not self._query_set:
            self._prev_cursor = None
            self._next_cursor = None
        else:
            first_entity = None
            last_entity = None

            lang = translation.get_language()

            try:
                # cached during iteration
                first_entity = self._first_elt or self._query_set[0]
                last_entity = self._last_elt or self._query_set[-1]
            except IndexError:
                self._prev_cursor = None
                self._next_cursor = None

            if first_entity is not None and last_entity is not None:
                self._prev_cursor = []
                self._next_cursor = []

                for field in self._order_by:
                    cf = CursorField(field, -1, self)

                    # prev cursor
                    if cf.is_descriptor:
                        if self.FIELDS_SEP in cf.name:
                            ff = cf.name.split(self.FIELDS_SEP)
                            renamed_table = "descr_" + ff[0].replace('.', '_')
                            self._prev_cursor.append(getattr(first_entity, "%s_%s" % (renamed_table, ff[1])))
                        else:
                            self._prev_cursor.append(first_entity.descriptors.get(cf.name))
                    elif cf.is_label:
                        self._prev_cursor.append(getattr(last_entity, cf.name)[lang])
                    elif cf.is_format:
                        pass
                    else:
                        if self.FIELDS_SEP in cf.name:
                            ff = cf.name.split(self.FIELDS_SEP)
                            self._prev_cursor.append(getattr(first_entity, "_".join(ff)))
                        elif cf.is_synonym:
                            self._prev_cursor.append(getattr(first_entity, cf.name))
                        elif self.model_fields[cf.name][0] == 'FK':
                            self._prev_cursor.append(getattr(first_entity, cf.name + '_id'))
                        elif cf.is_count:
                            self._prev_cursor.append(getattr(first_entity, cf.name + '__count'))
                        else:
                            self._prev_cursor.append(getattr(first_entity, cf.name))

                    # next cursor
                    if cf.is_descriptor:
                        if self.FIELDS_SEP in cf.name:
                            ff = cf.name.split(self.FIELDS_SEP)
                            renamed_table = "descr_" + ff[0].replace('.', '_')
                            self._next_cursor.append(getattr(last_entity, "%s_%s" % (renamed_table, ff[1])))
                        else:
                            self._next_cursor.append(last_entity.descriptors.get(cf.name))
                    elif cf.is_label:
                        self._next_cursor.append(getattr(last_entity, cf.name)[lang])
                    elif cf.is_format:
                        pass
                    else:
                        if self.FIELDS_SEP in cf.name:
                            ff = cf.name.split(self.FIELDS_SEP)
                            self._next_cursor.append(getattr(last_entity, "_".join(ff)))
                        elif cf.is_synonym:
                            self._next_cursor.append(getattr(last_entity, cf.name))
                        elif self.model_fields[cf.name][0] == 'FK':
                            self._next_cursor.append(getattr(last_entity, cf.name + '_id'))
                        elif cf.is_count:
                            self._next_cursor.append(getattr(last_entity, cf.name + '__count'))
                        else:
                            self._next_cursor.append(getattr(last_entity, cf.name))

        self._cursor_built = True

    def _parse_and_add_filters(self, filters, depth):
        if depth >= 4:
            raise CursorQueryError('Filter max depth allowed is 4')

        select_related = []

        for lfilter in filters:
            lfilter_type = type(lfilter)
            filter_type = (
                lfilter.get('type', None) if lfilter_type is dict else 'sub' if lfilter_type in (tuple, list) else None
            )

            # sub
            if filter_type == 'sub':
                self._parse_and_add_filters(lfilter, depth + 1)

            # term
            elif filter_type == 'term':
                field = lfilter.get('field', None)
                if not field:
                    raise CursorQueryValueError('Undefined field name')

                cf = CursorField(field, -1, self)

                if cf.is_descriptor:
                    # only if sub-value of descriptor
                    if self.FIELDS_SEP in cf.name:
                        select_related.append('#' + cf.name)

                elif cf.name in self.model_fields:
                    if self.model_fields[cf.name][0] == 'FK':
                        if self.FIELDS_SEP in cf.name:
                            select_related.append(cf.name)

            # op
            elif filter_type == 'op':
                pass

            # empty
            elif filter_type is None:
                pass

            else:
                raise CursorQueryError('Unrecognized filter type')

        # add for join
        self.add_select_related(select_related)

    def filter(self, *filters, **kfilters):
        """
        Defines criterion to filters. The max depth of lists is by default 3.

        :param filters: A structure compound of lists and sub-lists.
        :return: self
        """
        ltype = type(filters)

        if (ltype is tuple or ltype is list) and len(filters) > 0:
            # ignore empty
            lfilters = [f for f in filters if f]

            if lfilters:
                self._parse_and_add_filters(lfilters, 0)
                self._filter_clauses.extend(lfilters)
        elif ltype is dict:
            # ignore empty
            if filters:
                self._parse_and_add_filters([filters], 0)
                self._filter_clauses.append(filters)
        elif len(kfilters):
            lfilters = []

            for key, v in kfilters.items():
                if key.count('__'):
                    field, op = key.rsplit('__', 1)

                    if op not in CursorQuery.OPERATORS_MAP:
                        field = key
                        op = 'eq'
                else:
                    field = key
                    op = 'eq'

                # replace __ by -> for next processing, and remove _id to find it in fields names
                appended_field = re.sub(r'__', CursorQuery.FIELDS_SEP, field)
                appended_field = re.sub(r'_id', '', appended_field)

                lfilters.append({
                    'type': 'term',
                    'field': appended_field,
                    'value': v,
                    'op': op if op else 'eq'
                })

            self._parse_and_add_filters(lfilters, 0)
            self._filter_clauses.extend(lfilters)

        return self

    def _process_filter(self, filters=None, depth=0):
        if filters is None:
            filters = self._filter_clauses

        if depth >= 4:
            raise CursorQueryError('Filter max depth allowed is 4')

        db_table = self._model._meta.db_table
        lqs = []
        previous_type = 'op'

        lang = translation.get_language()

        for lfilter in filters:
            lfilter_type = type(lfilter)
            filter_type = (
                lfilter.get('type', None) if lfilter_type is dict else 'sub' if lfilter_type in (tuple, list) else None
            )

            if filter_type == 'sub':
                res = self._process_filter(lfilter, depth + 1)
                if res:
                    # two consecutive terms, insert a default AND operator
                    if previous_type != 'op':
                        lqs.append(" AND ")

                    lqs.append(res)
            # term
            elif filter_type == 'term':
                # two consecutive terms, insert a default AND operator
                if previous_type != 'op':
                    lqs.append(" AND ")

                field = lfilter.get('field', None)
                if not field:
                    raise CursorQueryValueError('Undefined field name')

                value = lfilter.get('value', None)
                cmp = lfilter.get('op', '=').lower()

                cf = CursorField(field, -1, self)

                if self.FIELDS_SEP in cf.name:
                    ff = cf.name.split(self.FIELDS_SEP)
                    field_model = self._related_tables[ff[0]][1][ff[1]]
                    op = self.ARRAY_OPERATORS_MAP.get(cmp) if field_model[0] == 'ARRAY' else self.OPERATORS_MAP.get(cmp)

                    # cmp is used with descriptor, otherwise map to a SQL operator
                    if not op:
                        raise CursorQueryValueError('Unrecognized term operator')

                    if cf.is_descriptor:
                        lqs.append(self._cast_descriptor_sub_type(ff[0], ff[1], op, self._convert_value(value, cmp)))
                    elif cf.is_label:
                        pass
                    elif cf.is_format:
                        pass
                    else:
                        lqs.append(self._cast_default_sub_type(ff[0], ff[1], op, self._convert_value(value, cmp)))
                else:
                    if cf.is_descriptor:
                        op = self.OPERATORS_MAP.get(cmp)
                        # cmp is used with descriptor, otherwise map to a SQL operator
                        if not op:
                            raise CursorQueryValueError('Unrecognized term operator')
                        # use cmp with descriptor format type
                        clause = self._cast_descriptor_type(db_table, cf.name, cmp, value)
                        if clause:
                            lqs.append(clause)
                    elif cf.is_label:
                        field_model = self.model_fields[cf.name]
                        op = self.ARRAY_OPERATORS_MAP.get(cmp) if field_model[0] == 'ARRAY' else self.OPERATORS_MAP.get(
                            cmp)
                        lqs.append(
                            self._cast_default_type(db_table, cf.name, op, self._convert_value(value, cmp), lang))
                    elif cf.is_format:
                        pass
                    elif cf.is_synonym:

                        if not self._synonym_model:
                            raise CursorQueryError(
                                'Synonym model is not define, use CursorQuery.set_synonym_model() method')
                        elif cf.name not in self._synonym_table_aliases:
                            self.join_synonym(cf)

                        alias = self._synonym_table_aliases[cf.name]

                        if cf.is_multiple_synonym:
                            op = self.MULTI_SYNONYM_OPERATORS_MAP.get(cmp)

                            lqs.append(self._cast_multi_synonym_type(db_table, alias, op,
                                                                     self._convert_multi_synonym_value(value, cmp)))

                        else:
                            op = self.OPERATORS_MAP.get(cmp)

                            lqs.append(self._cast_synonym_type(alias, op, self._convert_value(value, cmp)))

                    else:
                        if self._sub_query_array_fields.get(cf.name):
                            if not self._sub_query_array_fields[cf.name].get('handle'):
                                self.join_sub_query_array_field(cf)

                            field_model = ('ARRAY', 'INTEGER')

                            op = self.ARRAY_OPERATORS_MAP.get(cmp) if field_model[0] == 'ARRAY' else self.OPERATORS_MAP.get(cmp)

                            final_value = self._make_value(self._convert_value(value, cmp), field_model)

                            if field_model[0] == 'ARRAY' and isinstance(op, list) and op[0] == 'NOT':
                                lqs.append('NOT "%s"."%s" %s %s' % (db_table, cf.name, op[1], final_value))
                            else:
                                lqs.append('"%s"."%s" %s %s' % (db_table, cf.name, op, final_value))

                        else:
                            field_model = self.model_fields[cf.name]

                            op = self.ARRAY_OPERATORS_MAP.get(cmp) if field_model[0] == 'ARRAY' else self.OPERATORS_MAP.get(cmp)

                            lqs.append(self._cast_default_type(db_table, cf.name, op, self._convert_value(value, cmp)))

            # operator
            elif filter_type == 'op':
                # two consecutive operators, raise a value error
                if previous_type == 'op':
                    raise CursorQueryOperatorError('Two consecutive operators items')

                value = lfilter.get('value', '').lower()
                if value in ('and', '&&'):
                    lqs.append(' AND ')
                elif value in ('or', '||'):
                    lqs.append(' OR ')
                else:
                    raise CursorQueryOperatorError('Unrecognized composition operator')

            previous_type = filter_type

        if lqs:
            result = "(" + "".join(lqs) + ")"
        else:
            result = None

        if depth == 0 and result:
            self.query_where.append(result)

        return result

    @property
    def prev_cursor(self):
        """
        Return the build cursor from the query set results, used to get previous subset of results.
        """
        if not self._cursor_built:
            self._build_cursor()

        return self._prev_cursor

    @property
    def next_cursor(self):
        """
        Return the build cursor from the query set results, used to get next subset of results.
        """
        if not self._cursor_built:
            self._build_cursor()

        return self._next_cursor

    def _cast_default_type(self, table_name, field_name, operator, value, sub_field_name=None):
        field_model = self.model_fields[field_name]
        final_value = self._make_value(value, field_model)
        coalesce_value = self._make_value(None, field_model)

        # invalid empty set
        if final_value == '()':
            return 'FALSE'

        if field_model[2]:  # is null
            if field_model[0] == 'FK':
                return 'COALESCE("%s"."%s_id", %s) %s %s' % (
                    table_name, field_name, coalesce_value, operator, final_value)

            elif field_model[0] == 'JSON':
                return 'COALESCE("%s"."%s"->>\'%s\', %s) %s %s' % (
                    table_name, field_name, sub_field_name, coalesce_value, operator, final_value)

            elif field_model[0] == 'DATETIME':  # timestamp at precision at seconds
                return 'date_trunc(\'seconds\', "%s"."%s") %s %s' % (
                    table_name, field_name, operator, final_value)

            else:
                return 'COALESCE("%s"."%s", %s) %s %s' % (
                    table_name, field_name, coalesce_value, operator, final_value)
        else:
            if field_model[0] == 'FK':
                return '"%s"."%s_id" %s %s' % (table_name, field_name, operator, final_value)

            elif field_model[0] == 'JSON':
                return '"%s"."%s"->>\'%s\' %s %s' % (
                    table_name, field_name, sub_field_name, operator, final_value)

            elif field_model[0] == 'DATETIME':  # timestamp at precision at seconds
                return 'date_trunc(\'seconds\', "%s"."%s") %s %s' % (
                    table_name, field_name, operator, final_value)

            elif field_model[0] == 'ARRAY' and isinstance(operator, list) and operator[0] == 'NOT':
                return 'NOT "%s"."%s" %s %s' % (table_name, field_name, operator[1], final_value)

            else:
                return '"%s"."%s" %s %s' % (table_name, field_name, operator, final_value)

    def _cast_default_sub_type(self, table_name, field_name, operator, value):
        field_model = self._related_tables[table_name][1][field_name]
        final_value = self._make_value(value, field_model)
        coalesce_value = self._make_value(None, field_model)

        if field_model[2]:  # is null
            if field_model[0] == 'FK':
                return 'COALESCE("%s"."%s_id", %s) %s %s' % (
                    table_name, field_name, coalesce_value, operator, final_value)
            else:
                return 'COALESCE("%s"."%s", %s) %s %s' % (
                    table_name, field_name, coalesce_value, operator, final_value)
        else:
            if field_model[0] == 'FK':
                return '"%s"."%s_id" %s %s' % (table_name, field_name, operator, final_value)
            elif field_model[0] == 'ARRAY' and isinstance(operator, list) and operator[0] == 'NOT':
                return 'NOT "%s"."%s" %s %s' % (table_name, field_name, operator[1], final_value)
            else:
                return '"%s"."%s" %s %s' % (table_name, field_name, operator, final_value)

    def _cast_descriptor_type(self, table_name, descriptor_name, operator, value):
        description = self._description[descriptor_name]
        return description['handler'].operator(operator, table_name, descriptor_name, value)

    def _cast_descriptor_sub_type(self, descriptor_name, field_name, operator, value):
        # descriptor_name can contains some '.', replaces them by '_'
        renamed_table = "descr_" + descriptor_name.replace('.', '_')
        related_model, related_fields = self._related_tables[renamed_table]

        field_model = related_fields[field_name]
        final_value = self._make_value(value, field_model)
        coalesce_value = self._make_value(None, field_model)

        if field_model[2]:  # is null
            if field_model[0] == 'FK':
                return 'COALESCE("%s"."%s_id", %s) %s %s' % (
                    renamed_table, field_name, coalesce_value, operator, final_value)
            else:
                return 'COALESCE("%s"."%s", %s) %s %s' % (
                    renamed_table, field_name, coalesce_value, operator, final_value)
        else:
            if field_model[0] == 'FK':
                return '"%s"."%s_id" %s %s' % (renamed_table, field_name, operator, final_value)
            elif field_model[0] == 'ARRAY' and isinstance(operator, list) and operator[0] == 'NOT':
                return 'NOT "%s"."%s" %s %s' % (renamed_table, field_name, operator[1], final_value)
            else:
                return '"%s"."%s" %s %s' % (renamed_table, field_name, operator, final_value)

    def _cast_synonym_type(self, table_alias, operator, value):

        if value is None:
            value = 'NULL'

        final_value = self._make_value(value, ('TEXT', 'TEXT', False))
        coalesce_value = "'NULL'"

        return 'COALESCE("%s"."name", %s) %s %s' % (table_alias, coalesce_value, operator, final_value)

    def _cast_multi_synonym_type(self, table_alias, field_alias, operator, value):

        if value is None:
            value = "'{}'"

        final_value = self._make_value(value, ('TEXT', 'TEXT', False))

        if operator == 'ILIKE' or operator == 'LIKE':
            return 'array_to_string("%s"."%s", \'\\0\') %s %s' % (table_alias, field_alias, operator, final_value)
        if operator == '@>' or operator == 'NOT @>':
            return '"%s"."%s" %s \'{%s}\'' % (table_alias, field_alias, operator, value)
        else:
            return '"%s"."%s" %s %s' % (table_alias, field_alias, operator, value)

    def join_descriptor(self, description, descriptor_name, fields=None):
        model_fields = {}
        db_table = self._model._meta.db_table

        related_model = description['handler'].related_model(description['format'])
        join_db_table = related_model._meta.db_table

        # descriptor_name can contains some '.', replaces them by '_'
        renamed_table = "descr_" + descriptor_name.replace('.', '_')

        for field in related_model._meta.get_fields():
            if fields and field.name not in fields:
                continue

            if type(field) is models.fields.reverse_related.ManyToManyRel:
                # model_fields[field.name] = ('M2M', '', field.null)
                pass
            elif type(field) is models.fields.reverse_related.ManyToOneRel:
                # model_fields[field.name] = ('M2O', 'INTEGER', field.null)
                pass
            elif type(field) is models.fields.related.ManyToManyField:
                # model_fields[field.name] = ('M2M', '', field.null)
                pass
            elif type(field) is models.fields.related.ForeignKey:
                model_fields[field.name] = ('FK', 'INTEGER', field.null)
                self.query_select.append(
                    '"%s"."%s_id" AS "%s_%s_id"' % (renamed_table, field.name, renamed_table, field.name))
            elif type(field) is models.fields.IntegerField or type(field) == models.fields.AutoField:
                model_fields[field.name] = ('INTEGER', 'INTEGER', field.null)
                self.query_select.append(
                    '"%s"."%s" AS "%s_%s"' % (renamed_table, field.name, renamed_table, field.name))
            elif type(field) is JSONField:
                self.model_fields[field.name] = ('JSON', 'JSON', field.null)
                self.query_select.append(
                    '"%s"."%s" AS "%s_%s"' % (renamed_table, field.name, renamed_table, field.name))
            elif type(field) is ArrayField:
                if (type(field.base_field) is models.fields.IntegerField or
                        type(field.base_field) == models.fields.AutoField):
                    base_type = 'INTEGER'
                else:
                    base_type = 'TEXT'

                self.model_fields[field.name] = ('ARRAY', base_type, field.null)
                self.query_select.append(
                    '"%s"."%s" AS "%s_%s"' % (renamed_table, field.name, renamed_table, field.name))
            else:
                model_fields[field.name] = ('TEXT', 'TEXT', field.null)
                self.query_select.append(
                    '"%s"."%s" AS "%s_%s"' % (renamed_table, field.name, renamed_table, field.name))

        self._related_tables[renamed_table] = (related_model, model_fields)

        on_clauses = description['handler'].join(db_table, descriptor_name, renamed_table)
        _from = 'LEFT JOIN "%s" AS "%s" ON (%s)' % (join_db_table, renamed_table, on_clauses)

        self.query_from.append(_from)
        return self

    def join_sub_query_array_field(self, cf):

        related_db_table = self._sub_query_array_fields[cf.name]['related_db_table']
        selected_field = self._sub_query_array_fields[cf.name]['selected_field']
        from_related_field = self._sub_query_array_fields[cf.name]['from_related_field']
        to_related_field = self._sub_query_array_fields[cf.name]['to_related_field']
        alias = cf.name
        db_table = self._model._meta.db_table

        self.sub_query_select.append(
            'ARRAY(SELECT "%s"."%s" FROM "%s" WHERE "%s"."%s" = "%s"."%s" ) AS "%s"' % (
                related_db_table, selected_field, related_db_table, db_table, from_related_field, related_db_table,
                to_related_field, alias)
        )
        # self.query_select.append('"%s"."%s"' % (db_table, alias))

        self._sub_query_array_fields[cf.name]['handle'] = True

        return self

    def join_synonym(self, synonym_cf):
        db_table = self._model._meta.db_table
        synonym_db_table = self._synonym_model._meta.db_table
        alias = synonym_cf.name + "_" + synonym_db_table
        synonym_type = synonym_cf.synonym_type()

        self._synonym_table_aliases[synonym_cf.name] = alias

        # --------------- MULTI -----------------

        if synonym_cf.is_multiple_synonym:

            self.sub_query_select.append(
                'ARRAY(SELECT "%s"."name" FROM "%s" WHERE "%s"."synonym_type_id" = %d AND "%s"."entity_id" = "%s"."id" ) AS "%s"' % (
                    synonym_db_table, synonym_db_table, synonym_db_table, synonym_type.id, synonym_db_table, db_table,
                    alias))

            self.query_select.append('"%s"."%s" AS "%s"' % (db_table, alias, synonym_cf.name))

            # _sub_query_from = '(SELECT DISTINCT %s FROM "%s") AS "%s"' % (",".join(self.sub_query_select), db_table, db_table)
            #
            # self.query_from[0] = _sub_query_from

        # ---------------------------------------

        else:
            self.query_select.append('"%s"."name" AS "%s"' % (alias, synonym_cf.name))

            on_clause = [
                '"%s"."id" = "%s"."entity_id"' % (db_table, alias),
                '"%s"."synonym_type_id" = %d' % (alias, synonym_type.id)
            ]
            _from = 'LEFT JOIN "%s" AS "%s" ON (%s)' % (synonym_db_table, alias, " AND ".join(on_clause))

            self.query_from.append(_from)

        return self

    def join(self, related_field, fields=None):
        if related_field.startswith('#'):
            descriptor = related_field.lstrip('#')
            return self.join_descriptor(self._description[descriptor], descriptor, fields)

        model_fields = {}
        db_table = self._model._meta.db_table
        db_table_alias = related_field
        related_model = getattr(self._model, related_field)

        if type(related_model) is ForwardManyToOneDescriptor:
            join_db_table = related_model.field.related_model._meta.db_table

            for field in related_model.field.related_model._meta.get_fields():
                if fields and field.name not in fields:
                    continue

                if type(field) is models.fields.reverse_related.ManyToManyRel:
                    pass
                    # model_fields[field.name] = ('M2M', '', field.null)
                elif type(field) is models.fields.reverse_related.ManyToOneRel:
                    pass
                    # model_fields[field.name] = ('M2O', '', field.null)
                elif type(field) is models.fields.related.ManyToManyField:
                    pass
                    # model_fields[field.name] = ('M2M', '', field.null)
                elif type(field) is models.fields.related.ForeignKey:
                    model_fields[field.name] = ('FK', 'INTEGER', field.null)
                    self.query_select.append(
                        '"%s"."%s_id" AS "%s_%s_id"' % (db_table_alias, field.name, related_field, field.name))
                elif type(field) is models.fields.IntegerField or type(field) == models.fields.AutoField:
                    model_fields[field.name] = ('INTEGER', 'INTEGER', field.null)
                    self.query_select.append(
                        '"%s"."%s" AS "%s_%s"' % (db_table_alias, field.name, related_field, field.name))
                elif type(field) is JSONField:
                    self.model_fields[field.name] = ('JSON', 'JSON', field.null)
                    self.query_select.append(
                        '"%s"."%s" AS "%s_%s"' % (db_table_alias, field.name, related_field, field.name))
                elif type(field) is ArrayField:
                    if (type(field.base_field) is models.fields.IntegerField or
                            type(field.base_field) == models.fields.AutoField):
                        base_type = 'INTEGER'
                    else:
                        base_type = 'TEXT'

                    self.model_fields[field.name] = ('ARRAY', base_type, field.null)
                    self.query_select.append(
                        '"%s"."%s" AS "%s_%s"' % (db_table_alias, field.name, related_field, field.name))
                else:
                    model_fields[field.name] = ('TEXT', 'TEXT', field.null)
                    self.query_select.append(
                        '"%s"."%s" AS "%s_%s"' % (db_table_alias, field.name, related_field, field.name))

            self._related_tables[related_field] = (related_model.field.related_model, model_fields)

            on_clause = ['"%s"."%s_id" = "%s"."id"' % (db_table, related_field, db_table_alias)]
            _from = 'LEFT JOIN "%s" AS "%s" ON (%s)' % (join_db_table, db_table_alias, " AND ".join(on_clause))

            self.query_from.append(_from)

        elif type(related_model) is models.fields.related_descriptors.ManyToManyDescriptor:
            join_db_table = related_model.through._meta.db_table

            on_clause = ['"%s"."id" = "%s"."%s_id"' % (db_table, related_field, self._model._meta.model_name)]
            _from = 'LEFT JOIN "%s" AS "%s" ON (%s)' % (join_db_table, db_table_alias, " AND ".join(on_clause))

            self.query_from.append(_from)

        elif type(related_model) is models.fields.related_descriptors.ReverseManyToOneDescriptor:
            join_db_table = related_model.rel.related_model._meta.db_table

            # self._related_tables[related_field] = (related_model.field.related_model, model_fields)
            join_column = related_model.rel.field.column

            on_clause = ['"%s"."id" = "%s"."%s"' % (db_table, related_field, join_column)]
            _from = 'LEFT OUTER JOIN "%s" AS "%s" ON (%s)' % (join_db_table, db_table_alias, " AND ".join(on_clause))

            self.query_from.append(_from)

        return self

    def limit(self, limit):
        """
        Query set number of results limit (SQL LIMIT).

        :param limit: Integer
        :return: self
        """
        self.query_limit = limit
        return self

    def distinct(self):
        """
        Query set SELECT DISTINCT.

        :return: self
        """
        self.query_distinct = True
        return self

    def __len__(self):
        if self._query_set is None:
            self.sql()

        if type(self._query_set) is not list:
            try:
                self._query_set = list(self._query_set)
            except IndexError:
                self._query_set = list()
            except ProgrammingError as e:
                raise CursorQueryError('Invalid query arguments: ' + str(e))

        return len(self._query_set)

    def __iter__(self):
        if self._query_set is None:
            self.sql()

        try:
            for instance in self._query_set:
                for field, (related_model, model_fields) in self._related_tables.items():
                    if field.startswith('descr_'):
                        continue

                    new_model = related_model(id=getattr(instance, "%s_id" % field))
                    setattr(instance, "_%s_cache" % field, new_model)

                    for related_field in model_fields:
                        if model_fields[related_field][0] == 'FK':
                            field_name = related_field + '_id'
                            setattr(new_model, field_name, getattr(instance, "%s_%s" % (field, field_name)))
                        else:
                            setattr(new_model, related_field, getattr(instance, "%s_%s" % (field, related_field)))

                # cache them for cursor build
                if self._first_elt is None:
                    self._first_elt = instance

                self._last_elt = instance

                yield instance
        except ProgrammingError as e:
            raise CursorQueryError('Invalid query arguments: ' + str(e))

    def add_select_related(self, fields):
        if isinstance(self._select_related, bool):
            field_dict = {}
        else:
            field_dict = self._select_related
        for field in fields:
            d = field_dict
            for part in field.split(self.FIELDS_SEP):
                d = d.setdefault(part, {})

        self._select_related = field_dict

    def select_related(self, *fields):
        """
        Make left join to models related by fields.

        :param fields:
        :return: self
        """

        if self._query_set is not None:
            raise CursorQueryError("Cannot call select_related() after iterate over results")

        if fields == (None,):
            self._select_related = False
        elif fields:
            self.add_select_related(fields)
        else:
            self._select_related = True
        return self

    def set_synonym_model(self, synonym_model):
        """
        link entity to its synonym model.

        :param synonym_model: django model of the entity synonyms
        :return: self
        """

        if self._query_set is not None:
            raise CursorQueryError("Can not call set_synonym_model() after iterate over results")

        if self._synonym_model is not None:
            raise CursorQueryError("Can not call set_synonym_model() one more time")

        if issubclass(synonym_model, models.Model):
            self._synonym_model = synonym_model
        else:
            raise CursorQueryError("Only subclass of models.Model can be passed as arg to set_synonym_model() method")

        return self

    def m2m_to_array_field(self, relationship, selected_field, from_related_field, to_related_field, alias):
        """
        Add array field which contains elements of the given model field.
        """

        self._sub_query_array_fields[alias] = {
            'related_db_table': relationship.through._meta.db_table,
            'selected_field': selected_field,
            'from_related_field': from_related_field,
            'to_related_field': to_related_field
        }

        return self

    def prefetch_related(self, prefetch):
        """
        Make additional queries for many-to-many related.

        :param prefetch:
        :return: self
        """
        self._prefetch_related.append(prefetch)
        return self

    def inner_join(self, related_model, related_name=None, to_related_name=None, **kwargs):
        """
        Inner join a using related model, and a specified field name into the through model.
        The specified field name is defined a argument name whereas the value is the id.

        :param related_model: Model to inner join.
        :param related_name: If specified uses this field name as join term in place of the self.modelname in plural form.
        :param kwargs: FieldName=IntegerValue
        """
        if len(kwargs) < 1:
            raise CursorQueryError("Unspecified related field and value")

        db_table = self._model._meta.db_table
        short_db_table = self._model._meta.model_name

        if self._model._meta.default_related_name:
            model_name_alias = self._model._meta.default_related_name
        else:
            model_name_alias = self._model._meta.model_name + 's'

        to_model_name_alias = short_db_table

        # from
        if related_name is not None and type(related_name) is str:
            model_name_alias = related_name

        related_field_name, id_value = list(kwargs.items())[0]

        related_field = getattr(related_model, model_name_alias)
        if related_field is None:
            raise CursorQueryError("Unknown related field %s" % related_field)

        if type(related_field) is not models.fields.related_descriptors.ManyToManyDescriptor:
            raise CursorQueryError("Invalid related field %s" % related_field)

        # related field
        if not hasattr(related_field.through, related_field_name):
            raise CursorQueryError("Invalid related field name %s" % related_field_name)

        join_db_table = related_field.through._meta.db_table

        # to
        if to_related_name is not None and type(to_related_name) is str:
            to_model_name_alias = to_related_name

        # related field
        if not hasattr(related_field.through, to_model_name_alias):
            raise CursorQueryError("Invalid to related field name %s" % to_model_name_alias)

        to_related_field = getattr(related_field.through, to_model_name_alias)
        if to_related_field is None:
            raise CursorQueryError("Unknown to related field %s" % to_model_name_alias)

        if type(to_related_field) is not models.fields.related_descriptors.ForwardManyToOneDescriptor:
            raise CursorQueryError("Invalid to related field %s" % to_model_name_alias)

        # query part
        inner_join = 'INNER JOIN "%s" ON ("%s"."%s_id" = %i AND "%s"."id" = "%s"."%s_id")' % (
            join_db_table, join_db_table, related_field_name, id_value, db_table, join_db_table, to_model_name_alias
        )

        self.query_from.append(inner_join)

    def set_count(self, related_field):
        self._counts.append(related_field)

        related_model = getattr(self._model, related_field)
        if type(related_model) is models.fields.related_descriptors.ReverseManyToOneDescriptor:
            # uses a left outer join
            short_db_table = self._model._meta.model_name
            self.join(related_field, [short_db_table])
        elif type(related_model) is models.fields.related_descriptors.ManyToManyDescriptor:
            # uses a left outer join
            short_db_table = self._model._meta.model_name
            self.join(related_field, [short_db_table])

            # uses a prefetch related (additional query) no longer necessary because of the join
            # self._prefetch_related.append(related_field)

    def _process_count(self):
        db_table = self._model._meta.db_table
        add_group_by = False

        for related_field in self._counts:
            related_model = getattr(self._model, related_field)

            if type(related_model) is models.fields.related_descriptors.ReverseManyToOneDescriptor:
                related_field_column = related_model.rel.field.column

                self.query_select.append('COUNT("%s"."%s") AS "%s__count"' % (
                    related_field, related_field_column, related_field))

                add_group_by = True

            elif type(related_model) is models.fields.related_descriptors.ManyToManyDescriptor:
                self.query_select.append('COUNT(DISTINCT "%s"."id") AS "%s__count"' % (
                    related_field, related_field))

                add_group_by = True

        if add_group_by:
            self.query_group_by.append('"%s"."id"' % (db_table,))

    def sql(self):
        """
        Build the SQL query that will be performed directly if there is some prefetch related,
        or at iterator called else.

        :return: Query set
        """
        # does not perform twice
        if self._query_set is not None:
            return self._query_set

        # perform joins using select_related
        if type(self._select_related) is dict:
            for related_model, related_fields in self._select_related.items():
                self.join(related_model, related_fields)

        try:
            self._process_cursor()
            self._process_filter()
            self._process_order_by()
            self._process_count()
        except KeyError as e:
            raise CursorQueryError(e)

        # perform sub query
        if len(self.sub_query_select) > 1:
            _sub_query_from = '(SELECT DISTINCT %s FROM "%s") AS "%s"' % (
                ",".join(self.sub_query_select), self._model._meta.db_table, self._model._meta.db_table)
            self.query_from[0] = _sub_query_from

        _select = "SELECT DISTINCT " if self.query_distinct else "SELECT " + ", ".join(self.query_select)
        _from = "FROM " + " ".join(self.query_from)

        if self.query_group_by:
            _group_by = "GROUP BY " + ", ".join(self.query_group_by)
        else:
            _group_by = ""

        if self.query_order_by:
            _order_by = "ORDER BY " + ", ".join(self.query_order_by)
        else:
            _order_by = ""

        if self.query_limit:
            _limit = "LIMIT %i" % self.query_limit
        else:
            _limit = ""

        if self.query_filters:
            if self.query_where:
                _where = "WHERE (%s) AND (%s)" % (" AND ".join(self.query_filters), " OR ".join(self.query_where))
            else:
                _where = "WHERE " + " AND ".join(self.query_filters)
        else:
            _where = "WHERE " + " OR ".join(self.query_where)

        if (
                self.query_where or self.query_filters) and self.query_group_by and self.query_order_by and self.query_limit:
            sql = " ".join([_select, _from, _where, _group_by, _order_by, _limit])
        else:
            sql = _select

            if _from:
                sql = sql + " " + _from

            if self.query_where or self.query_filters:
                sql = sql + " " + _where

            if self.query_group_by:
                sql = sql + " " + _group_by

            if self.query_order_by:
                sql = sql + " " + _order_by

            if self.query_limit:
                sql = sql + " " + _limit

        self._query_set = self._model.objects.raw(sql)
        self._first_elt = None
        self._last_elt = None

        if self._prefetch_related:
            # eval before
            try:
                self._query_set = list(self._query_set)
            except IndexError:
                self._query_set = list()
            except ProgrammingError as e:
                raise CursorQueryError('Invalid query arguments: ' + str(e))

            prefetch_related_objects(self._query_set, *self._prefetch_related)
        return self._query_set

    def get(self):
        """
        Get a single element for the query. Raise a model DoesNotExists exception if there is no results, or a
        MultipleObjectsReturned if there is more than 1 unique result.

        :return: The unique model instance.
        """
        if self._query_set is None:
            self.sql()

        if len(self._query_set) == 0:
            raise self._model.DoesNotExist()
        elif len(self._query_set) > 1:
            raise self.MultipleObjectsReturned()

        instance = self._query_set[0]
        for field, (related_model, model_fields) in self._related_tables.items():
            if field.startswith('descr_'):
                continue

            new_model = related_model(id=getattr(instance, "%s_id" % field))
            setattr(instance, "_%s_cache" % field, new_model)

            for related_field in model_fields:
                setattr(new_model, related_field, getattr(instance, "%s_%s" % (field, related_field)))

        return instance

    def count(self):
        """
        Only does the count of the number of results.

        :return: Integer count value.
        """

        # perform joins using select_related, like for normal SQL but does not perform the ORDER BY and LIMIT
        if type(self._select_related) is dict:
            for related_model, related_fields in self._select_related.items():
                self.join(related_model, related_fields)

        try:
            self._process_cursor()
            self._process_filter()
        except KeyError as e:
            raise CursorQueryError(e)

        # perform sub query
        if len(self.sub_query_select) > 1:
            _sub_query_from = '(SELECT DISTINCT %s FROM "%s") AS "%s"' % (
                ",".join(self.sub_query_select), self._model._meta.db_table, self._model._meta.db_table)
            self.query_from[0] = _sub_query_from

        _select = "SELECT DISTINCT COUNT(*)" if self.query_distinct else "SELECT COUNT(*)"
        _from = "FROM " + " ".join(self.query_from)

        if self.query_filters:
            if self.query_where:
                _where = "WHERE (%s) AND (%s)" % (" AND ".join(self.query_filters), " OR ".join(self.query_where))
            else:
                _where = "WHERE " + " AND ".join(self.query_filters)
        else:
            _where = "WHERE " + " OR ".join(self.query_where)

        if self.query_where or self.query_filters:
            sql = " ".join([_select, _from, _where])
        else:
            sql = _select

            if _from:
                sql = sql + " " + _from

            if self.query_where or self.query_filters:
                sql = sql + " " + _where

        cursor = connection.cursor()
        cursor.execute(sql)
        row = cursor.fetchone()

        return row[0]
