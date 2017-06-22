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
from django.db import models
from django.db.models import prefetch_related_objects
from django.db.models.fields.related_descriptors import ForwardManyToOneDescriptor

from descriptor.descriptorcolumns import get_description


class CursorQuery(object):
    """
    Make easier the usage of cursor for pagination in query set.
    """

    FIELDS_SEP = "->"

    def __init__(self, model):
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

        db_table = model._meta.db_table

        self.model_fields = {}

        self._description = get_description(self._model)

        for field in model._meta.get_fields():
            if type(field) is models.fields.reverse_related.ManyToManyRel:
                self.model_fields[field.name] = ('M2M', '')
            elif type(field) is models.fields.reverse_related.ManyToOneRel:
                self.model_fields[field.name] = ('M2O', '')
            elif type(field) is models.fields.related.ForeignKey:
                self.model_fields[field.name] = ('FK', 'INTEGER')
                self.query_select.append('"%s"."%s_id"' % (db_table, field.name))
            elif type(field) is models.fields.IntegerField or type(field) == models.fields.AutoField:
                self.model_fields[field.name] = ('INTEGER', 'INTEGER')
                self.query_select.append('"%s"."%s"' % (db_table, field.name))
            elif type(field) is JSONField:
                self.model_fields[field.name] = ('JSON', 'JSON')
                self.query_select.append('"%s"."%s"' % (db_table, field.name))
            else:
                self.model_fields[field.name] = ('TEXT', 'TEXT')
                self.query_select.append('"%s"."%s"' % (db_table, field.name))

            # @todo maybe for DATE (idem for join)

    def cursor(self, cursor, cursor_fields=('id',)):
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

    def _perform_cursor(self):
        db_table = self._model._meta.db_table

        if self._cursor:
            _where = []
            previous = []
            i = 0

            # @todo if cursor as NULL value todo case INTEGER, TEXT, DATE...

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
                                lqs.append(self._cast_sub_type(pff[0], pff[1], prev_ope, self._cursor[prev_i]))
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
                            lqs.append(self._cast_sub_type(ff[0], ff[1], op, self._cursor[i]))
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
                            lqs.append(self._cast_sub_type(ff[0], ff[1], op, self._cursor[i]))
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

    def _make_value(self, value, cast_type):
        if value is None:
            if cast_type == 'INTEGER' or cast_type == 'FK':
                return "0"  # "NULL"
            else:
                return "''"  # "NULL"

        if cast_type == 'INTEGER' or cast_type == 'FK':
            try:
                int(value)
            except ValueError:
                return 0  # "NULL"

            return str(value)
        else:
            return "'" + value.replace("'", "''") + "'"

    def order_by(self, *args):
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
                    cast_type = description['model'].data
                else:
                    cast_type = self.model_fields[f][1]

            # @todo must use descriptor comparators
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

    def filter(self, filters):
        # @todo OR AND structured criterion
        name = filters.get('name', '')
        field = "name"

        db_table = self._model._meta.db_table

        # name search based on synonyms
        if filters.get('method', 'icontains') == 'icontains':
            op = "ILIKE"
            value = "'%%" + name.replace("'", "''") + "%%'"  # need to escape % because of django raw
        else:
            op = "="

        where = '"%s"."%s" %s %s' % (db_table, field, op, value)

        # @todo if table is from inner join or model, and like, type (integer...)
        # and what now about descriptor comparator ????
        self.query_where.append(where)

        return self

    @property
    def prev_cursor(self):
        if not self._cursor_built:
            self._build_cursor()

        return self._prev_cursor

    @property
    def next_cursor(self):
        if not self._cursor_built:
            self._build_cursor()

        return self._next_cursor

    def _cast_default_type(self, table_name, field_name, operator, value):
        cast_type = self.model_fields[field_name][1]
        final_value = self._make_value(value, cast_type)
        coalesce_value = self._make_value(None, cast_type)
        uses_coalesce = True

        if uses_coalesce:
            return 'COALESCE("%s"."%s", %s) %s %s' % (
                table_name, field_name, coalesce_value, operator, final_value)
        else:
            return '"%s"."%s" %s %s' % (
                table_name, field_name, operator, final_value)

    def _cast_default_sub_type(self, table_name, field_name, operator, value):
        cast_type = self._related_tables[table_name][1][field_name]
        final_value = self._make_value(value, cast_type)
        coalesce_value = self._make_value(None, cast_type)
        uses_coalesce = True

        if uses_coalesce:
            return 'COALESCE("%s"."%s", %s) %s %s' % (
                self._related_tables[table_name][0]._meta.db_table, field_name, coalesce_value, operator, final_value)
        else:
            return '"%s"."%s" %s %s' % (
                self._related_tables[table_name][0]._meta.db_table, field_name, operator, final_value)

    def _cast_descriptor_type(self, table_name, descriptor_name, operator, value):
        description = self._description[descriptor_name]

        cast_type = description['model'].data
        final_value = self._make_value(value, cast_type)
        coalesce_value = self._make_value(None, cast_type)
        uses_coalesce = True

        if uses_coalesce:
            if cast_type != "TEXT":
                return 'COALESCE(CAST("%s"."descriptors"->>\'%s\' AS %s), %s) %s %s' % (
                    table_name, descriptor_name, cast_type, coalesce_value, operator, final_value)
            else:
                return 'COALESCE(("%s"."descriptors"->>\'%s\'), %s) %s %s' % (
                    table_name, descriptor_name, coalesce_value, operator, final_value)
        else:
            if cast_type != "TEXT":
                return 'CAST("%s"."descriptors"->>\'%s\' AS %s) %s %s' % (
                    table_name, descriptor_name, cast_type, operator, final_value)
            else:
                return '("%s"."descriptors"->>\'%s\') %s %s' % (table_name, descriptor_name, operator, final_value)

    def _cast_sub_type(self, descriptor_name, field_name, operator, value):
        # descriptor_name can contains some '.', replaces them by '_'
        renamed_table = "descr_" + descriptor_name.replace('.', '_')
        related_model, related_fields = self._related_tables[renamed_table]

        cast_type = related_fields[field_name][1]
        final_value = self._make_value(value, cast_type)
        coalesce_value = self._make_value(None, cast_type)
        uses_coalesce = True

        if uses_coalesce:
            return 'COALESCE("%s"."%s", %s) %s %s' % (renamed_table, field_name, coalesce_value, operator, final_value)
        else:
            return '"%s"."%s" %s %s' % (renamed_table, field_name, operator, final_value)

    def join_descriptor(self, description, descriptor_name, fields=None):
        model_fields = {}
        db_table = self._model._meta.db_table

        related_model = description['model'].related_model(description['format'])
        join_db_table = related_model._meta.db_table

        # descriptor_name can contains some '.', replaces them by '_'
        renamed_table = "descr_" + descriptor_name.replace('.', '_')

        for field in related_model._meta.get_fields():
            if fields and field.name not in fields:
                continue

            if type(field) is models.fields.reverse_related.ManyToManyRel:
                # model_fields[field.name] = ('M2M', '')
                pass
            elif type(field) is models.fields.reverse_related.ManyToOneRel:
                # model_fields[field.name] = ('M2O', '')
                pass
            elif type(field) is models.fields.related.ForeignKey:
                model_fields[field.name + '_id'] = ('FK', 'INTEGER')
                self.query_select.append('"%s"."%s_id" AS "%s_%s_id"' % (renamed_table, field.name, renamed_table, field.name))
            elif type(field) is models.fields.IntegerField or type(field) == models.fields.AutoField:
                model_fields[field.name] = ('INTEGER', 'INTEGER')
                self.query_select.append('"%s"."%s" AS "%s_%s"' % (renamed_table, field.name, renamed_table, field.name))
            elif type(field) is JSONField:
                self.model_fields[field.name] = ('JSON', 'JSON')
                self.query_select.append('"%s"."%s" AS "%s_%s"' % (renamed_table, field.name, renamed_table, field.name))
            else:
                model_fields[field.name] = ('TEXT', 'TEXT')
                self.query_select.append('"%s"."%s" AS "%s_%s"' % (renamed_table, field.name, renamed_table, field.name))

        self._related_tables[renamed_table] = (related_model, model_fields)

        on_clauses = description['model'].select(db_table, descriptor_name, renamed_table)
        _from = 'LEFT JOIN "%s" AS "%s" ON (%s)' % (join_db_table, renamed_table, " AND ".join(on_clauses))

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
                    # model_fields[field.name] = ('M2M',)
                elif type(field) is models.fields.reverse_related.ManyToOneRel:
                    pass
                    # model_fields[field.name] = ('M2O',)
                elif type(field) is models.fields.related.ForeignKey:
                    model_fields[field.name + '_id'] = ('FK', 'INTEGER')
                    # self.query_select.append('"%s"."%s_id" AS "%s_%s_id"' % (join_db_table, field.name))
                    self.query_select.append('"%s"."%s_id" AS "%s_%s_id"' % (join_db_table, field.name, related_field, field.name))
                elif type(field) is models.fields.IntegerField or type(field) == models.fields.AutoField:
                    model_fields[field.name] = ('INTEGER', 'INTEGER')
                    # self.query_select.append('"%s"."%s"' % (join_db_table, field.name))
                    self.query_select.append('"%s"."%s" AS "%s_%s"' % (join_db_table, field.name, related_field, field.name))
                elif type(field) is JSONField:
                    self.model_fields[field.name] = ('JSON', 'JSON')
                    # self.query_select.append('"%s"."%s"' % (join_db_table, field.name))
                    self.query_select.append('"%s"."%s" AS "%s_%s"' % (join_db_table, field.name, related_field, field.name))
                else:
                    model_fields[field.name] = ('TEXT', 'TEXT')
                    # self.query_select.append('"%s"."%s"' % (join_db_table, field.name))
                    self.query_select.append('"%s"."%s" AS "%s_%s"' % (join_db_table, field.name, related_field, field.name))

        self._related_tables[related_field] = (related_model.field.related_model, model_fields)

        on_clause = ['"%s"."%s_id" = "%s"."id"' % (db_table, related_field, join_db_table)]
        _from = 'LEFT JOIN "%s" ON (%s)' % (join_db_table, " AND ".join(on_clause))

        self.query_from.append(_from)
        return self

    def limit(self, limit):
        self.query_limit = limit
        return self

    def distinct(self):
        self.query_distinct = True
        return self

    def __iter__(self):
        if self._query_set is None:
            self.sql()

        for instance in self._query_set:
            for field, (related_model, model_fields) in self._related_tables.items():
                if field.startswith('descr_'):
                    continue

                new_model = related_model(id=getattr(instance, "%s_id" % field))
                setattr(instance, "_%s_cache" % field, new_model)

                for related_field in model_fields:
                    setattr(new_model, related_field, getattr(instance, "%s_%s" % (field, related_field)))

            yield instance

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
        if self._query_set is not None:
            raise TypeError("Cannot call select_related() after iterate over results")

        if fields == (None,):
            self._select_related = False
        elif fields:
            self.add_select_related(fields)
        else:
            self._select_related = True
        return self

    def prefetch_related(self, prefetch):
        self._prefetch_related.append(prefetch)
        return self

    def sql(self):
        # does not perform twice
        if self._query_set is not None:
            return self._query_set

        # perform joins using select_related
        for related_model, related_fields in self._select_related.items():
            self.join(related_model, related_fields)

        try:
            self._perform_cursor()
            self._process_order_by()
        except KeyError:
            raise

        _select = "SELECT DISTINCT " if self.query_distinct else "SELECT " + ", ".join(self.query_select)
        _from = "FROM " + " ".join(self.query_from)
        # _where = "WHERE " + " OR ".join(self.query_where)
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

            prefetch_related_objects(self._query_set, *self._prefetch_related)

        return self._query_set
