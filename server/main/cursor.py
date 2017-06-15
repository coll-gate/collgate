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
from django.db.models import Q, prefetch_related_objects
from django.db.models.expressions import OrderBy, RawSQL
from django.db.models.fields.related_descriptors import ForwardManyToOneDescriptor

from descriptor.descriptorcolumns import get_description


class ManualCursorQuery(object):
    """
    Make easier the usage of cursor for pagination in query set.
    """

    FIELDS_SEP = "->"

    def __init__(self, model, cursor=None, order_by=('id',)):
        self._model = model
        self._query_set = None
        self._order_by = order_by

        self._cursor = cursor
        self._description = None

        self._cursor_built = False
        self._prev_cursor = None
        self._next_cursor = None

        self.query_select = []
        self.query_distinct = None
        self.query_from = ['"%s"' % model._meta.db_table]
        self.query_where = []
        self.query_order_by = []
        self.query_limit = None

        self._select_related = {}
        self._prefetch_related = []

        db_table = model._meta.db_table

        self.model_fields = {}

        self._description = get_description(self._model)

        for field in model._meta.get_fields():
            if type(field) is models.fields.reverse_related.ManyToManyRel:
                self.model_fields[field.name] = ('M2M',)
            elif type(field) is models.fields.reverse_related.ManyToOneRel:
                self.model_fields[field.name] = ('M2O',)
            elif type(field) is models.fields.related.ForeignKey:
                self.model_fields[field.name] = ('FK',)
                self.query_select.append('"%s"."%s_id"' % (db_table, field.name))
            elif type(field) is models.fields.IntegerField or type(field) == models.fields.AutoField:
                self.model_fields[field.name] = ('INTEGER',)
                self.query_select.append('"%s"."%s"' % (db_table, field.name))
            elif type(field) is JSONField:
                self.model_fields[field.name] = ('JSON',)
                self.query_select.append('"%s"."%s"' % (db_table, field.name))
            else:
                self.model_fields[field.name] = ('TEXT',)
                self.query_select.append('"%s"."%s"' % (db_table, field.name))

        if cursor:
            _where = []
            previous = []
            i = 0

            for field in order_by:
                f = field.lstrip('+-#')
                is_descriptor = field[0] == '#' or field[1] == '#'
                op = '<' if field[0] == '-' else '>'
                ope = '<=' if field[0] == '-' else '>='

                if len(previous):
                    lqs = []

                    for prev_field, prev_i, prev_op, prev_ope, prev_is_descriptor in previous:
                        if prev_is_descriptor:
                            if self.FIELDS_SEP in prev_field:
                                pff = prev_field.split(self.FIELDS_SEP)

                                # @todo
                                descr = self._description[pff[0]]
                                cast_type = 'TEXT'  # 'INTEGER' if descr['model'].related_model else 'TEXT' (sub)

                                value = self._make_value(cursor[prev_i], cast_type)
                                lqs.append('"descr_%s"."%s" %s %s' % (pff[0], pff[1], prev_ope, value))
                            else:
                                # @todo
                                descr = self._description[prev_field]
                                cast_type = 'INTEGER' if descr['model'].related_model else 'TEXT'

                                value = self._make_value(cursor[prev_i], cast_type)

                                if cast_type == 'INTEGER':
                                    lqs.append('CAST("%s"."descriptors"->>\'%s\' AS %s) %s %s' % (
                                        db_table, prev_field, cast_type, prev_ope, value))
                                else:
                                    lqs.append('("%s"."descriptors"->>\'%s\') %s %s' % (
                                        db_table, prev_field, prev_ope, value))
                        else:
                            value = self._make_value(cursor[prev_i], self.model_fields[prev_field][0])
                            lqs.append('"%s"."%s" %s %s' % (db_table, prev_field, prev_ope, value))

                    if is_descriptor:
                        if self.FIELDS_SEP in f:
                            ff = f.split(self.FIELDS_SEP)

                            # @todo
                            descr = self._description[ff[0]]
                            cast_type = 'TEXT'  # 'INTEGER' if descr['model'].related_model else 'TEXT' (sub)

                            value = self._make_value(cursor[i], cast_type)
                            lqs.append('"descr_%s"."%s" %s %s' % (ff[0], ff[1], op, value))
                        else:
                            # @todo
                            descr = self._description[f]
                            cast_type = 'INTEGER' if descr['model'].related_model else 'TEXT'

                            value = self._make_value(cursor[i], cast_type)

                            if cast_type == 'INTEGER':
                                lqs.append('CAST("%s"."descriptors"->>\'%s\' AS %s) %s %s' % (
                                    db_table, f, cast_type, op, value))
                            else:
                                lqs.append('("%s"."descriptors"->>\'%s\') %s %s' % (db_table, f, op, value))
                    else:
                        value = self._make_value(cursor[i], self.model_fields[f][0])
                        lqs.append('"%s"."%s" %s %s' % (db_table, f, op, value))

                    _where.append(" AND ".join(lqs))
                else:
                    if is_descriptor:
                        if self.FIELDS_SEP in f:
                            ff = f.split(self.FIELDS_SEP)

                            # @todo
                            descr = self._description[ff[0]]
                            cast_type = 'TEXT'  # 'INTEGER' if descr['model'].related_model else 'TEXT' (sub)

                            value = self._make_value(cursor[i], cast_type)
                            _where.append('"descr_%s"."%s" %s %s' % (ff[0], ff[1], op, value))
                        else:
                            # @todo
                            descr = self._description[f]
                            cast_type = 'INTEGER' if descr['model'].related_model else 'TEXT'

                            value = self._make_value(cursor[i], cast_type)

                            if cast_type == 'INTEGER':
                                _where.append('CAST("%s"."descriptors"->>\'%s\' AS %s) %s %s' % (
                                    db_table, f, cast_type, op, value))
                            else:
                                _where.append('("%s"."descriptors"->>\'%s\') %s %s' % (db_table, f, op, value))
                    else:
                        value = self._make_value(cursor[i], self.model_fields[f][0])
                        _where.append('"%s"."%s" %s %s' % (db_table, f, op, value))

                previous.append((f, i, op, ope, is_descriptor))

                i += 1

            self.query_where.append(" OR ".join(_where))

    def _make_value(self, value, cast_type):
        if value is None:
            return "NULL"

        if cast_type == 'INTEGER' or cast_type == 'FK':
            try:
                int(value)
            except ValueError:
                return "NULL"

            return "%s" % value
        else:
            return "'%s'" % value.replace("'", "''")

    def order_by(self):
        db_table = self._model._meta.db_table

        for field in self._order_by:
            f = field.lstrip('+-#')
            order = "DESC" if field[0] == '-' else "ASC"
            is_descriptor = field[0] == '#' or field[1] == '#'

            if self.FIELDS_SEP in f:
                ff = f.split(self.FIELDS_SEP)

                if is_descriptor:
                    descr = self._description[ff[0]]
                    cast_type = 'TEXT'  # 'INTEGER' if descr['model'].related_model else 'TEXT' (sub) @todo
                else:
                    cast_type = self.model_fields[ff[0]][0]  #@todo
            else:
                if is_descriptor:
                    descr = self._description[f]
                    cast_type = 'INTEGER' if descr['model'].related_model else 'TEXT'
                else:
                    cast_type = self.model_fields[f][0]

            # @todo must use descriptor comparator and cast_type
            if is_descriptor:
                if self.FIELDS_SEP in f:
                    ff = f.split(self.FIELDS_SEP)
                    self.query_order_by.append('"descr_%s"."%s" %s' % (ff[0], ff[1], order))
                else:
                    if cast_type == 'INTEGER':
                        self.query_order_by.append('CAST("%s"."descriptors"->>\'%s\' as INTEGER) %s' % (db_table, f, order))
                    else:
                        self.query_order_by.append('("%s"."descriptors"->>\'%s\') %s' % (db_table, f, order))
                        # self.query_order_by.append('CAST("%s"."descriptors"->>\'%s\' as TEXT) %s' % (db_table, f, order))
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
                        self._prev_cursor.append(getattr(entity, "descr_%s_%s" % (ff[0], ff[1])))
                    else:
                        self._prev_cursor.append(entity.descriptors.get(f))
                else:
                    self._prev_cursor.append(getattr(entity, f))

                # next cursor
                entity = self._query_set[-1]

                if is_descriptor:
                    if self.FIELDS_SEP in f:
                        ff = f.split(self.FIELDS_SEP)
                        self._next_cursor.append(getattr(entity, "descr_%s_%s" % (ff[0], ff[1])))
                    else:
                        self._next_cursor.append(entity.descriptors.get(f))
                else:
                    self._next_cursor.append(getattr(entity, f))

        self._cursor_built = True

    def filters(self, filters):
        # @todo OR AND structured criterion
        name = filters.get('name', '')
        field = "name"
        value = '"%s"' % name

        db_table = self._model._meta.db_table

        # name search based on synonyms
        if filters.get('method', 'icontains') == 'icontains':
            op = "%LIKE%"
        else:
            op = "="

        where = '"%s"."%s" %s %s' % (db_table, field, op, value)

        # @todo if table is from inner join or model, and like, type (integer...)
        # and what now about descriptor comparator ????
        self._query_where.append(where)

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

    def join_descriptor(self, description, descriptor_name, fields=None):
        model_fields = {}
        db_table = self._model._meta.db_table

        related_model = description['model'].related_model
        join_db_table = related_model._meta.db_table

        # descriptor_name can contains some '.', replaces them by '_'
        renamed_table = "descr_" + descriptor_name.replace('.', '_')

        for field in related_model._meta.get_fields():
            if fields and field.name not in fields:
                continue

            if type(field) is models.fields.reverse_related.ManyToManyRel:
                # model_fields[field.name] = ('M2M',)
                pass
            elif type(field) is models.fields.reverse_related.ManyToOneRel:
                # model_fields[field.name] = ('M2O',)
                pass
            elif type(field) is models.fields.related.ForeignKey:
                model_fields[field.name + '_id'] = ('FK',)
                self.query_select.append('"%s"."%s_id" AS "%s_%s_id"' % (renamed_table, field.name, renamed_table, field.name))
            elif type(field) is models.fields.IntegerField or type(field) == models.fields.AutoField:
                model_fields[field.name] = ('INTEGER',)
                self.query_select.append('"%s"."%s" AS "%s_%s"' % (renamed_table, field.name, renamed_table, field.name))
            elif type(field) is JSONField:
                self.model_fields[field.name] = ('JSON',)
                self.query_select.append('"%s"."%s" AS "%s_%s"' % (renamed_table, field.name, renamed_table, field.name))
            else:
                model_fields[field.name] = ('TEXT',)
                self.query_select.append('"%s"."%s" AS "%s_%s"' % (renamed_table, field.name, renamed_table, field.name))

        self._select_related[renamed_table] = (related_model, model_fields)

        # @todo from description
        cast_type = "INTEGER" if self._description[descriptor_name]['model'].related_model else "TEXT"

        if cast_type == "INTEGER":
            on_clause = ['("%s"."descriptors"->>\'%s\')::%s = "%s"."id"' % (db_table, descriptor_name, cast_type, renamed_table)]
        else:
            on_clause = ['("%s"."descriptors"->>\'%s\') = "%s"."id"' % (db_table, descriptor_name, renamed_table)]

        _from = 'INNER JOIN "%s" AS "%s" ON (%s)' % (join_db_table, renamed_table, ", ".join(on_clause))

        self.query_from.append(_from)
        return self

    def _cast_type(self, field):
        # @todo
        return ""

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
                    model_fields[field.name + '_id'] = ('FK',)
                    # self.query_select.append('"%s"."%s_id" AS "%s_%s_id"' % (join_db_table, field.name))
                    self.query_select.append('"%s"."%s_id" AS "%s_%s_id"' % (join_db_table, field.name, related_field, field.name))
                elif type(field) is models.fields.IntegerField or type(field) == models.fields.AutoField:
                    model_fields[field.name] = ('INTEGER',)
                    # self.query_select.append('"%s"."%s"' % (join_db_table, field.name))
                    self.query_select.append('"%s"."%s" AS "%s_%s"' % (join_db_table, field.name, related_field, field.name))
                elif type(field) is JSONField:
                    self.model_fields[field.name] = ('JSON',)
                    # self.query_select.append('"%s"."%s"' % (join_db_table, field.name))
                    self.query_select.append('"%s"."%s" AS "%s_%s"' % (join_db_table, field.name, related_field, field.name))
                else:
                    model_fields[field.name] = ('TEXT',)
                    # self.query_select.append('"%s"."%s"' % (join_db_table, field.name))
                    self.query_select.append('"%s"."%s" AS "%s_%s"' % (join_db_table, field.name, related_field, field.name))

        self._select_related[related_field] = (related_model.field.related_model, model_fields)

        on_clause = ['"%s"."%s_id" = "%s"."id"' % (db_table, related_field, join_db_table)]
        _from = 'INNER JOIN "%s" ON (%s)' % (join_db_table, ", ".join(on_clause))

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
            for field, (related_model, model_fields) in self._select_related.items():
                if field.startswith('descr_'):
                    continue

                new_model = related_model(id=getattr(instance, "%s_id" % field))
                setattr(instance, "_%s_cache" % field, new_model)

                for related_field in model_fields:
                    setattr(new_model, related_field, getattr(instance, "%s_%s" % (field, related_field)))

            yield instance

    # def select_related(self, *fields):
    #     if fields == (None,):
    #         self._select_related = False
    #     elif fields:
    #         self.add_select_related(fields)
    #     else:
    #         self._select_related = True
    #     return self

    def prefetch_related(self, prefetch):
        self._prefetch_related.append(prefetch)
        return self

    def sql(self):
        _select = "SELECT DISTINCT " if self.query_distinct else "SELECT " + ", ".join(self.query_select)
        _from = "FROM " + " ".join(self.query_from)
        _where = "WHERE " + " OR ".join(self.query_where)
        _order_by = "ORDER BY " + ", ".join(self.query_order_by)
        _limit = "LIMIT %i" % self.query_limit

        if self.query_where and self.query_order_by and self.query_limit:
            sql = " ".join([_select, _from, _where, _order_by, _limit])
        else:
            sql = _select

            if _from:
                sql = sql + " " + _from

            if self.query_where:
                sql = sql + " " + _where

            if self.query_order_by:
                sql = sql + " " + _order_by

            if self.query_limit:
                sql = sql + " " + _limit

        self._query_set = self._model.objects.raw(sql)

        if self._prefetch_related:
            # eval before
            self._query_set = list(self._query_set)
            prefetch_related_objects(self._query_set, *self._prefetch_related)

        return self._query_set


class CursorQuery(object):
    """
    Make easier the usage of cursor for pagination in query set.
    """

    def __init__(self, objects, cursor=None, order_by=('id',)):
        self._objects = objects
        self._query_set = None
        self._order_by = order_by

        self._items = []

        self._cursor = cursor

        self._prev_cursor = None
        self._next_cursor = None

        if cursor:
            q_cursors = Q()
            previous = []
            i = 0
            #
            # for field in order_by:
            #     f = field.lstrip('+-')
            #     op = 'lt' if field[0] == '-' else 'gt'
            #     ope = 'lte' if field[0] == '-' else 'gte'
            #
            #     # @todo if value is None
            #
            #     if len(previous):
            #         lqs = Q(**{'%s__%s' % (f, ope): cursor[i]})
            #         last = len(previous) - 1
            #         i2 = 0
            #
            #         for prev_field, prev_i, prev_op, prev_ope in previous:
            #             if i2 == last:
            #                 lqs &= Q(**{'%s__%s' % (prev_field, prev_op): cursor[prev_i]})
            #             else:
            #                 lqs &= Q(**{'%s__%s' % (prev_field, prev_ope): cursor[prev_i]})
            #
            #             i2 += 1
            #
            #         q_cursors |= lqs
            #     else:
            #         q_cursors |= Q(**{'%s__%s' % (f, op): cursor[i]})
            #
            #     previous.append((f, i, op, ope))
            #
            #     # q_cursors &= lqs
            #     i += 1

            #self._query_set = objects.extra(where=['"geonames_country_name" = "France"'])

            for field in order_by:
                f = field.lstrip('+-')
                op = 'lt' if field[0] == '-' else 'gt'
                ope = 'lte' if field[0] == '-' else 'gte'

                # @todo if value is None

                if len(previous):
                    lqs = Q()

                    for prev_field, prev_i, prev_op, prev_ope in previous:
                        lqs &= Q(**{'%s__%s' % (prev_field, prev_ope): cursor[prev_i]})

                    lqs &= Q(**{'%s__%s' % (f, op): cursor[i]})

                    q_cursors |= lqs
                else:
                    q_cursors |= Q(**{'%s__%s' % (f, op): cursor[i]})

                previous.append((f, i, op, ope))

                # q_cursors &= lqs
                i += 1

            # self._query_set = objects.filter(q_cursors)
            self._query_set = self._query_set.filter(q_cursors)
        else:
            self._query_set = objects.all()

    def order_by(self, query_set=None):
        orders_by = []
        db_table = self._objects.model._meta.db_table

        for field in self._order_by:
            f = field.lstrip('+-')
            descending = field[0] == '-'

            if f.startswith('descriptors__'):
                # @todo must take descriptor comparator
                raw = "CAST(%s.descriptors->>%%s as INTEGER)" % db_table

                orders_by.append(OrderBy(RawSQL(raw, (f.split('__')[1],)), descending=descending))
                # orders_by.append(OrderBy(RawSQL("CAST(accession_accession.descriptors->>%s as INTEGER)", (db_table, f.split('__')[1],)), descending=descending))
                # orders_by.append(OrderBy(RawSQL("LOWER(descriptors->>%s)", (f.split('__')[1],)), descending=descending))
            else:
                orders_by.append(field)

        if query_set is None:
            self._query_set = self._query_set.order_by(*orders_by)
        else:
            self._query_set = query_set.order_by(*orders_by)

        return self._query_set

    @property
    def query_set(self):
        return self._query_set

    def add_item(self, item):
        self.items.append(item)

    def update(self):
        if len(self.items) > 0:
            self._prev_cursor = []
            self._next_cursor = []

            for field in self._order_by:
                f = field.lstrip('+-')

                # prev cursor
                entity = self.items[0]

                if f.startswith('descriptors__'):
                    self._prev_cursor.append(entity['descriptors'][f.split('__')[1]])
                else:
                    self._prev_cursor.append(entity[f])

                # next cursor
                entity = self.items[-1]

                if f.startswith('descriptors__'):
                    self._next_cursor.append(entity['descriptors'][f.split('__')[1]])
                else:
                    self._next_cursor.append(entity[f])

            # # prev cursor
            # entity = self.items[0]
            # self._prev_cursor.append(entity['id'])
            #
            # # next cursor
            # entity = self.items[-1]
            # self._next_cursor.append(entity['id'])
        else:
            self._prev_cursor = None
            self._next_cursor = None

    def filters(self, filters):
        # @todo
        name = filters.get('name', '')

        # name search based on synonyms
        if filters.get('method', 'icontains') == 'icontains':
            self._query_set = self._query_set.filter(Q(synonyms__name__icontains=name))
        else:
            self._query_set = self._query_set.filter(Q(name__iexact=name)).filter(Q(synonyms__name__iexact=name))

        # @todo must take descriptor comparator

    @property
    def items(self):
        return self._items

    @property
    def prev_cursor(self):
        return self._prev_cursor

    @property
    def next_cursor(self):
        return self._next_cursor

