# -*- coding: utf-8; -*-
#
# @file cursor.py
# @brief Cursor based pagination, search and filter.
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2016-09-01
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details

from django.contrib.postgres.fields import JSONField
from django.db import models, ProgrammingError, connection
from django.db.models import prefetch_related_objects
from django.db.models.fields.related_descriptors import ForwardManyToOneDescriptor

from descriptor.descriptorcolumns import get_description


class CursorQueryError(Exception):

    def __init__(self, message):
        super(Exception, self).__init__(message)


class CursorQueryValueError(CursorQueryError):

    def __init__(self, message):
        super(Exception, self).__init__("Value error: " + message)


class CursorQueryOperatorError(CursorQueryError):

    def __init__(self, message):
        super(Exception, self).__init__("Operator error: " + message)


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
        '=': '=',
        'eq': '=',
        '!=': '!=',
        'neq': '!=',
        'gte': '>=',
        'gt': '>',
        'lte': '<=',
        'lt': '<',
        'contains': 'LIKE',
        'icontains': 'ILIKE',
        'startswith': 'LIKE',
        'istartswith': 'ILIKE',
        'endswith': 'LIKE',
        'iendswith': 'ILIKE'
    }

    def __init__(self, model, db='default'):
        self._model = model
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
        self.query_limit = None

        self._related_tables = {}

        self._select_related = False
        self._prefetch_related = []

        self._filter_clauses = []

        db_table = model._meta.db_table

        self.model_fields = {}

        self._description = get_description(self._model)

        for field in model._meta.get_fields():
            if type(field) is models.fields.reverse_related.ManyToManyRel:
                self.model_fields[field.name] = ('M2M', '', field.null)
            elif type(field) is models.fields.reverse_related.ManyToOneRel:
                self.model_fields[field.name] = ('M2O', '', field.null)
            elif type(field) is models.fields.related.ForeignKey:
                self.model_fields[field.name] = ('FK', 'INTEGER', field.null)
                self.query_select.append('"%s"."%s_id"' % (db_table, field.name))
            elif type(field) is models.fields.IntegerField or type(field) == models.fields.AutoField:
                self.model_fields[field.name] = ('INTEGER', 'INTEGER', field.null)
                self.query_select.append('"%s"."%s"' % (db_table, field.name))
            elif type(field) is JSONField:
                self.model_fields[field.name] = ('JSON', 'JSON', field.null)
                self.query_select.append('"%s"."%s"' % (db_table, field.name))
            else:
                self.model_fields[field.name] = ('TEXT', 'TEXT', field.null)
                self.query_select.append('"%s"."%s"' % (db_table, field.name))

            # @todo maybe for DATE (idem for join)

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
            f = field.lstrip('+-#')
            is_descriptor = field[0] == '#' or field[1] == '#'

            if is_descriptor:
                # only if sub-value of descriptor
                if self.FIELDS_SEP in f:
                    select_related.append('#' + f)
            elif f in self.model_fields:
                if self.model_fields[f][0] == 'FK':
                    select_related.append(f)

        self.add_select_related(select_related)
        return self

    def _process_cursor(self):
        db_table = self._model._meta.db_table

        if self._cursor:
            _where = []
            previous = []
            i = 0

            for field in self._cursor_fields:
                f = field.lstrip('+-#')
                is_descriptor = field[0] == '#' or field[1] == '#'
                op = '<' if field[0] == '-' else '>'
                ope = '<=' if field[0] == '-' else '>='

                lqs = []

                if len(previous):
                    for prev_field, prev_i, prev_op, prev_ope, prev_is_descriptor in previous:
                        # if self._cursor[prev_i] is None:
                        #    continue

                        if prev_is_descriptor:
                            if self.FIELDS_SEP in prev_field:
                                pff = prev_field.split(self.FIELDS_SEP)
                                lqs.append(self._cast_descriptor_sub_type(pff[0], pff[1], prev_ope, self._cursor[prev_i]))
                            else:
                                lqs.append(self._cast_descriptor_type(db_table, prev_field, prev_ope, self._cursor[prev_i]))
                        else:
                            if self.FIELDS_SEP in prev_field:
                                pff = prev_field.split(self.FIELDS_SEP)
                                lqs.append(self._cast_default_sub_type(pff[0], pff[1], prev_ope, self._cursor[prev_i]))
                            else:
                                lqs.append(self._cast_default_type(db_table, prev_field, prev_ope, self._cursor[prev_i]))

                    if is_descriptor:
                        if self.FIELDS_SEP in f:
                            ff = f.split(self.FIELDS_SEP)
                            lqs.append(self._cast_descriptor_sub_type(ff[0], ff[1], op, self._cursor[i]))
                        else:
                            lqs.append(self._cast_descriptor_type(db_table, f, op, self._cursor[i]))
                    else:
                        if self.FIELDS_SEP in f:
                            ff = f.split(self.FIELDS_SEP)
                            lqs.append(self._cast_default_sub_type(ff[0], ff[1], op, self._cursor[i]))
                        else:
                            lqs.append(self._cast_default_type(db_table, f, op, self._cursor[i]))

                    # if self._cursor[i] is not None:
                    _where.append("(%s)" % " AND ".join(lqs))
                else:
                    if is_descriptor:
                        if self.FIELDS_SEP in f:
                            ff = f.split(self.FIELDS_SEP)
                            lqs.append(self._cast_descriptor_sub_type(ff[0], ff[1], op, self._cursor[i]))
                        else:
                            lqs.append(self._cast_descriptor_type(db_table, f, op, self._cursor[i]))
                    else:
                        if self.FIELDS_SEP in f:
                            ff = f.split(self.FIELDS_SEP)
                            lqs.append(self._cast_default_sub_type(ff[0], ff[1], op, self._cursor[i]))
                        else:
                            lqs.append(self._cast_default_type(db_table, f, op, self._cursor[i]))

                    # if self._cursor[i] is not None:
                    _where.append("(%s)" % " AND ".join(lqs))

                previous.append((f, i, op, ope, is_descriptor))

                i += 1

            self.query_filters.append(" OR ".join(_where))

    def _make_value(self, value, field_data):
        if value is None:
            if field_data[1] == 'INTEGER':
                if field_data[2]:
                    return "0"
                else:
                    return "NULL"
            else:
                if field_data[2]:
                    return "''"
                else:
                    return "NULL"

        if field_data[1] == 'INTEGER':
            try:
                int(value)
            except ValueError:
                if field_data[2]:
                    return "0"
                else:
                    return "NULL"

            return str(value)
        else:
            return "'" + value.replace("'", "''") + "'"

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
            f = field.lstrip('+-#')
            is_descriptor = field[0] == '#' or field[1] == '#'

            if is_descriptor:
                # only if sub-value of descriptor
                if self.FIELDS_SEP in f:
                    select_related.append('#' + f)
            elif f in self.model_fields:
                if self.model_fields[f][0] == 'FK':
                    select_related.append(f)

        self.add_select_related(select_related)
        return self

    def _process_order_by(self):
        db_table = self._model._meta.db_table

        for field in self._order_by:
            f = field.lstrip('+-#')
            order = "DESC NULLS LAST" if field[0] == '-' else "ASC NULLS FIRST"
            is_descriptor = field[0] == '#' or field[1] == '#'

            if self.FIELDS_SEP in f:
                ff = f.split(self.FIELDS_SEP)

                if is_descriptor:
                    renamed_table = "descr_" + ff[0].replace('.', '_')
                    related_model, related_fields = self._related_tables[renamed_table]

                    cast_type = related_fields[ff[1]][1]
                else:
                    cast_type = self.model_fields[ff[0]][1]
            else:
                if is_descriptor:
                    description = self._description[f]
                    cast_type = description['handler'].data
                else:
                    cast_type = self.model_fields[f][1]

            if is_descriptor:
                if self.FIELDS_SEP in f:
                    ff = f.split(self.FIELDS_SEP)
                    renamed_table = "descr_" + ff[0].replace('.', '_')
                    self.query_order_by.append('"%s"."%s" %s' % (renamed_table, ff[1], order))
                else:
                    if cast_type != 'TEXT':
                        self.query_order_by.append('CAST("%s"."descriptors"->>\'%s\' as %s) %s' % (
                            db_table, f, cast_type, order))
                    else:
                        self.query_order_by.append('("%s"."descriptors"->>\'%s\') %s' % (db_table, f, order))
            else:
                if self.FIELDS_SEP in f:
                    ff = f.split(self.FIELDS_SEP)
                    self.query_order_by.append('"%s" %s' % ("_".join(ff), order))
                else:
                    self.query_order_by.append('"%s"."%s" %s' % (db_table, f, order))

        return self

    @property
    def query_set(self):
        return self._query_set

    def _build_cursor(self):
        if not self._query_set:
            self._prev_cursor = None
            self._next_cursor = None
        else:
            self._prev_cursor = []
            self._next_cursor = []

            for field in self._order_by:
                f = field.lstrip('+-#')
                is_descriptor = field[0] == '#' or field[1] == '#'

                # prev cursor
                entity = self._query_set[0]

                if is_descriptor:
                    if self.FIELDS_SEP in f:
                        ff = f.split(self.FIELDS_SEP)
                        renamed_table = "descr_" + ff[0].replace('.', '_')
                        self._prev_cursor.append(getattr(entity, "%s_%s" % (renamed_table, ff[1])))
                    else:
                        self._prev_cursor.append(entity.descriptors.get(f))
                else:
                    if self.FIELDS_SEP in f:
                        ff = f.split(self.FIELDS_SEP)
                        self._prev_cursor.append(getattr(entity, "_".join(ff)))
                    else:
                        self._prev_cursor.append(getattr(entity, f))

                # next cursor
                entity = self._query_set[-1]

                if is_descriptor:
                    if self.FIELDS_SEP in f:
                        ff = f.split(self.FIELDS_SEP)
                        renamed_table = "descr_" + ff[0].replace('.', '_')
                        self._next_cursor.append(getattr(entity, "%s_%s" % (renamed_table, ff[1])))
                    else:
                        self._next_cursor.append(entity.descriptors.get(f))
                else:
                    if self.FIELDS_SEP in f:
                        ff = f.split(self.FIELDS_SEP)
                        self._next_cursor.append(getattr(entity, "_".join(ff)))
                    else:
                        self._next_cursor.append(getattr(entity, f))

        self._cursor_built = True

    def _parse_and_add_filters(self, filters, depth):
        if depth >= 3:
            raise CursorQueryError('Filter max depth allowed is 3')

        select_related = []

        for lfilter in filters:
            lfilter_type = type(lfilter)
            filter_type = lfilter.get('type', None) if lfilter_type is dict else 'sub' if lfilter_type in (tuple, list) else None

            # sub
            if filter_type == 'sub':
                self._parse_and_add_filters(lfilter, depth+1)

            # term
            elif filter_type == 'term':
                field = lfilter.get('field', None)
                if not field:
                    raise CursorQueryValueError('Undefined field name')

                f = field.lstrip('#')
                is_descriptor = field[0] == '#' or field[1] == '#'

                if is_descriptor:
                    # only if sub-value of descriptor
                    if self.FIELDS_SEP in f:
                        select_related.append('#' + f)
                elif f in self.model_fields:
                    if self.model_fields[f][0] == 'FK':
                        select_related.append(f)

            # op
            elif filter_type == 'op':
                pass

            else:
                raise CursorQueryError('Unrecognized filter type')

        # add for join
        self.add_select_related(select_related)

    def filter(self, *filters):
        """
        Defines criterion to filters. The max depth of lists is by default 3.

        :param filters: A structure compound of lists and sub-lists.
        :return: self
        """
        for lfilter in filters:
            ltype = type(lfilter)

            if ltype is str:
                pass
            elif ltype is tuple or ltype is list:
                self._parse_and_add_filters(lfilter, 0)
                self._filter_clauses.extend(lfilter)
            elif ltype is dict:
                pass

        return self

    def _process_filter(self, filters=None, depth=0):
        if filters is None:
            filters = self._filter_clauses

        if depth >= 3:
            raise CursorQueryError('Filter max depth allowed is 3')

        db_table = self._model._meta.db_table
        lqs = []
        previous_type = 'op'

        for lfilter in filters:
            lfilter_type = type(lfilter)
            filter_type = lfilter.get('type', None) if lfilter_type is dict else 'sub' if lfilter_type in (tuple, list) else None

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
                op = self.OPERATORS_MAP.get(cmp)

                if not op:
                    raise CursorQueryValueError('Unrecognized term operator')

                if cmp in ('contains', 'icontains'):
                    value = "%%" + value + "%%"
                elif cmp in ('startswith', 'istartswith'):
                    value = value + "%%"
                elif cmp in ('endswith', 'iendswith'):
                    value = "%%" + value

                f = field.lstrip('#')
                is_descriptor = field[0] == '#' or field[1] == '#'

                if is_descriptor:
                    if self.FIELDS_SEP in f:
                        ff = f.split(self.FIELDS_SEP)
                        lqs.append(self._cast_descriptor_sub_type(ff[0], ff[1], op, value))
                    else:
                        lqs.append(self._cast_descriptor_type(db_table, f, op, value))
                else:
                    if self.FIELDS_SEP in f:
                        ff = f.split(self.FIELDS_SEP)
                        lqs.append(self._cast_default_sub_type(ff[0], ff[1], op, value))
                    else:
                        lqs.append(self._cast_default_type(db_table, f, op, value))
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

    def _cast_default_type(self, table_name, field_name, operator, value):
        field_model = self.model_fields[field_name]
        final_value = self._make_value(value, field_model)
        coalesce_value = self._make_value(None, field_model)

        if field_model[2]:  # is null
            return 'COALESCE("%s"."%s", %s) %s %s' % (
                table_name, field_name, coalesce_value, operator, final_value)
        else:
            return '"%s"."%s" %s %s' % (
                table_name, field_name, operator, final_value)

    def _cast_default_sub_type(self, table_name, field_name, operator, value):
        field_model = self._related_tables[table_name][1][field_name]
        final_value = self._make_value(value, field_model)
        coalesce_value = self._make_value(None, field_model)

        if field_model[2]:  # is null
            return 'COALESCE("%s"."%s", %s) %s %s' % (
                self._related_tables[table_name][0]._meta.db_table, field_name, coalesce_value, operator, final_value)
        else:
            return '"%s"."%s" %s %s' % (
                self._related_tables[table_name][0]._meta.db_table, field_name, operator, final_value)

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
            return 'COALESCE("%s"."%s", %s) %s %s' % (renamed_table, field_name, coalesce_value, operator, final_value)
        else:
            return '"%s"."%s" %s %s' % (renamed_table, field_name, operator, final_value)

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
                # model_fields[field.name] = ('M2O', '', field.null)
                pass
            elif type(field) is models.fields.related.ForeignKey:
                # @todo could be TEXT
                model_fields[field.name + '_id'] = ('FK', 'INTEGER', field.null)
                self.query_select.append('"%s"."%s_id" AS "%s_%s_id"' % (renamed_table, field.name, renamed_table, field.name))
            elif type(field) is models.fields.IntegerField or type(field) == models.fields.AutoField:
                model_fields[field.name] = ('INTEGER', 'INTEGER', field.null)
                self.query_select.append('"%s"."%s" AS "%s_%s"' % (renamed_table, field.name, renamed_table, field.name))
            elif type(field) is JSONField:
                self.model_fields[field.name] = ('JSON', 'JSON', field.null)
                self.query_select.append('"%s"."%s" AS "%s_%s"' % (renamed_table, field.name, renamed_table, field.name))
            else:
                model_fields[field.name] = ('TEXT', 'TEXT', field.null)
                self.query_select.append('"%s"."%s" AS "%s_%s"' % (renamed_table, field.name, renamed_table, field.name))

        self._related_tables[renamed_table] = (related_model, model_fields)

        on_clauses = description['handler'].join(db_table, descriptor_name, renamed_table)
        _from = 'LEFT JOIN "%s" AS "%s" ON (%s)' % (join_db_table, renamed_table, on_clauses)

        self.query_from.append(_from)
        return self

    def join(self, related_field, fields=None):
        if related_field.startswith('#'):
            descriptor = related_field.lstrip('#')
            return self.join_descriptor(self._description[descriptor], descriptor, fields)

        model_fields = {}
        db_table = self._model._meta.db_table

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
                elif type(field) is models.fields.related.ForeignKey:
                    # @todo could be TEXT
                    model_fields[field.name + '_id'] = ('FK', 'INTEGER', field.null)
                    # self.query_select.append('"%s"."%s_id" AS "%s_%s_id"' % (join_db_table, field.name))
                    self.query_select.append('"%s"."%s_id" AS "%s_%s_id"' % (join_db_table, field.name, related_field, field.name))
                elif type(field) is models.fields.IntegerField or type(field) == models.fields.AutoField:
                    model_fields[field.name] = ('INTEGER', 'INTEGER', field.null)
                    # self.query_select.append('"%s"."%s"' % (join_db_table, field.name))
                    self.query_select.append('"%s"."%s" AS "%s_%s"' % (join_db_table, field.name, related_field, field.name))
                elif type(field) is JSONField:
                    self.model_fields[field.name] = ('JSON', 'JSON', field.null)
                    # self.query_select.append('"%s"."%s"' % (join_db_table, field.name))
                    self.query_select.append('"%s"."%s" AS "%s_%s"' % (join_db_table, field.name, related_field, field.name))
                else:
                    model_fields[field.name] = ('TEXT', 'TEXT', field.null)
                    # self.query_select.append('"%s"."%s"' % (join_db_table, field.name))
                    self.query_select.append('"%s"."%s" AS "%s_%s"' % (join_db_table, field.name, related_field, field.name))

        self._related_tables[related_field] = (related_model.field.related_model, model_fields)

        on_clause = ['"%s"."%s_id" = "%s"."id"' % (db_table, related_field, join_db_table)]
        _from = 'LEFT JOIN "%s" ON (%s)' % (join_db_table, " AND ".join(on_clause))

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
                        setattr(new_model, related_field, getattr(instance, "%s_%s" % (field, related_field)))

                yield instance
        except ProgrammingError as e:
            raise CursorQueryError('Invalid query arguments')

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

    def prefetch_related(self, prefetch):
        """
        Make additional queries for many-to-many related.

        :param prefetch:
        :return: self
        """
        self._prefetch_related.append(prefetch)
        return self

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
            self._process_order_by()
            self._process_filter()
        except KeyError as e:
            raise CursorQueryError(e)

        _select = "SELECT DISTINCT " if self.query_distinct else "SELECT " + ", ".join(self.query_select)
        _from = "FROM " + " ".join(self.query_from)
        _order_by = "ORDER BY " + ", ".join(self.query_order_by)
        _limit = "LIMIT %i" % self.query_limit

        if self.query_filters:
            if self.query_where:
                _where = "WHERE (%s) AND (%s)" % (" AND ".join(self.query_filters), " OR ".join(self.query_where))
            else:
                _where = "WHERE " + " AND ".join(self.query_filters)
        else:
            _where = "WHERE " + " OR ".join(self.query_where)

        if (self.query_where or self.query_filters) and self.query_order_by and self.query_limit:
            sql = " ".join([_select, _from, _where, _order_by, _limit])
        else:
            sql = _select

            if _from:
                sql = sql + " " + _from

            if self.query_where or self.query_filters:
                sql = sql + " " + _where

            if self.query_order_by:
                sql = sql + " " + _order_by

            if self.query_limit:
                sql = sql + " " + _limit

        self._query_set = self._model.objects.raw(sql)

        if self._prefetch_related:
            # eval before
            try:
                self._query_set = list(self._query_set)
            except IndexError:
                self._query_set = list()
            except ProgrammingError:
                raise CursorQueryError('Invalid query arguments')

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
            raise self._model.DoesNotExists()
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
        if type(self._select_related) is list:
           for related_model, related_fields in self._select_related.items():
                self.join(related_model, related_fields)

        try:
            self._process_cursor()
            self._process_filter()
        except KeyError as e:
            raise CursorQueryError(e)

        _select = "SELECT DISTINCT COUNT(*)" if self.query_distinct else "SELECT COUNT(*)"   # + ", ".join(self.query_select)
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
