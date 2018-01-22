# -*- coding: utf-8; -*-
#
# @file models.py
# @brief coll-gate descriptor module models
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2016-09-01
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details

import codecs
import json
import hashlib

from django.contrib.contenttypes.models import ContentType
from django.contrib.postgres.fields import JSONField
from django.core.exceptions import SuspiciousOperation
from django.db.models import Q, Transform
from django.shortcuts import get_object_or_404
from django.utils import translation
from django.utils.translation import ugettext_lazy as _

from main.models import Entity

from django.db import connections, models
from django.db.models.sql.compiler import SQLCompiler

from igdectk.common.models import ChoiceEnum, IntegerChoice


class NullsLastSQLCompiler(SQLCompiler):
    def get_order_by(self):
        result = super().get_order_by()
        if result and self.connection.vendor == 'postgresql':
            res = [(expr, (sql + ' NULLS LAST', params, is_ref))
                   for (expr, (sql, params, is_ref)) in result]
            return res
        return result


class NullsLastQuery(models.sql.query.Query):
    """Use a custom compiler to inject 'NULLS LAST' (for PostgreSQL)."""

    def get_compiler(self, using=None, connection=None):
        if using is None and connection is None:
            raise ValueError("Need either using or connection")
        if using:
            connection = connections[using]
        return NullsLastSQLCompiler(self, connection, using)


class NullsLastQuerySet(models.QuerySet):
    def __init__(self, model=None, query=None, using=None, hints=None):
        super().__init__(model, query, using, hints)
        self.query = query or NullsLastQuery(self.model)


class MultipleObjectsReturned(Exception):
    """The query returned multiple objects when only one was expected."""
    pass

# class DescriptorGroup(Entity):
#     """
#     Category of a type of descriptor.
#     """
#
#     server_cache_update = ("descriptor", "entity_columns")
#     client_cache_update = ("entity_columns",)
#
#     # unique group name
#     name = models.CharField(unique=True, max_length=255, db_index=True)
#
#     # Is this group of descriptors can be deleted when it is empty
#     can_delete = models.BooleanField(default=True)
#
#     # Is this group of descriptors can be modified (rename, add/remove descriptors)
#     # by an authorized staff people
#     can_modify = models.BooleanField(default=True)
#
#     class Meta:
#         verbose_name = _("descriptor group")
#
#     def natural_name(self):
#         return self.name
#
#     @classmethod
#     def make_search_by_name(cls, term):
#         return Q(name__istartswith=term)
#
#     def audit_create(self, user):
#         return {
#             'name': self.name,
#             'can_delete': self.can_delete,
#             'can_modify': self.can_modify
#         }
#
#     def audit_update(self, user):
#         if hasattr(self, 'updated_fields'):
#             result = {'updated_fields': self.updated_fields}
#
#             if 'name' in self.updated_fields:
#                 result['name'] = self.name
#
#             if 'can_delete' in self.updated_fields:
#                 result['can_delete'] = self.can_delete
#
#             if 'can_modify' in self.updated_fields:
#                 result['can_modify'] = self.can_modify
#
#             return result
#         else:
#             return {
#                 'name': self.name,
#                 'can_delete': self.can_delete,
#                 'can_modify': self.can_modify
#             }
#
#     def audit_delete(self, user):
#         return {
#             'name': self.name
#         }


class Descriptor(Entity):
    """
    Type of descriptor for a model.
    """

    server_cache_update = ("descriptor", "entity_columns")
    client_cache_update = ("entity_columns",)

    # unique name of type of descriptor
    name = models.CharField(unique=True, max_length=255, db_index=True)

    # Label of the layout of descriptor.
    # It is i18nized used JSON dict with language code as key and label as string value.
    label = JSONField(default={})

    # code can be a Crop Ontology ('CO_XYZ') code (see http://www.cropontology.org/ontology)
    # and http://www.cropontology.org/get-ontology/CO_[0-9]{3,} to get a JSON version.
    # Internals codes are prefixed by 'XY_' where 'XY' is 'IN' for initials values.
    code = models.CharField(unique=True, max_length=64)

    # default should belong to the general group.
    # group = models.ForeignKey(DescriptorGroup, related_name='types_set')
    group_name = models.CharField(max_length=255, db_index=True, null=True, default=None)

    # informative description.
    description = models.TextField(blank=True, default="")

    # JSON encoded values (mostly a dict or empty). Value are classified by language at the first
    # level of JSON dict.
    values = JSONField(default=None, null=True, blank=True)

    # JSON encoded format of the descriptor
    format = JSONField(default={"type": "undefined"})

    # Is this descriptor can be deleted by an authorised staff people
    can_delete = models.BooleanField(default=True)
    # Is this descriptor can be modified (rename, add/remove/modify its values)
    # by an authorised staff people
    can_modify = models.BooleanField(default=True)

    class Meta:
        verbose_name = _("descriptor")

    @classmethod
    def get_defaults_columns(cls):
        return {
            'code': {
                'label': _('Code'),
                'query': False,  # done by a prefetch related
                'format': {
                    'type': 'string',
                    'model': 'descriptor.descriptor'
                },
                'available_operators': ['isnull', 'notnull', 'eq', 'neq', 'icontains']
            },
            'name': {
                'label': _('Name'),
                'query': False,  # done by a prefetch related
                'format': {
                    'type': 'string',
                    'model': 'descriptor.descriptor'
                },
                'available_operators': ['isnull', 'notnull', 'eq', 'neq', 'icontains']
            },
            'label': {
                'label': _('Label'),
                'query': False,  # done by a prefetch related
                'format': {
                    'type': 'string',
                    'model': 'descriptor.descriptor'
                },
                'available_operators': ['isnull', 'notnull', 'eq', 'neq', 'icontains']
            },
            'group_name': {
                'label': _('Group'),
                'query': False,  # done by a prefetch related
                'format': {
                    'type': 'string',  # todo: create a value set by a select distinct query
                    'model': 'descriptor.descriptor'
                },
                'available_operators': ['isnull', 'notnull', 'eq', 'neq', 'icontains']
            },
            'description': {
                'label': _('Description'),
                'query': False,  # done by a prefetch related
                'format': {
                    'type': 'string',
                    'model': 'descriptor.descriptor'
                },
                'available_operators': ['isnull', 'notnull', 'eq', 'neq', 'icontains']
            }
        }

    def natural_name(self):
        return self.name

    @classmethod
    def make_search_by_name(cls, term):
        return Q(name__istartswith=term) | Q(code__istartswith=term)

    def audit_create(self, user):
        return {
            'name': self.name,
            'code': self.code,
            'group': self.group_name,
            'description': self.description,
            'values': self.values,
            'format': self.format,
            'can_delete': self.can_delete,
            'can_modify': self.can_modify
        }

    def audit_update(self, user):
        if hasattr(self, 'updated_fields'):
            result = {'updated_fields': self.updated_fields}

            if 'name' in self.updated_fields:
                result['name'] = self.name

            if 'code' in self.updated_fields:
                result['code'] = self.code

            if 'group' in self.updated_fields:
                result['group'] = self.group_name

            if 'description' in self.updated_fields:
                result['description'] = self.description

            if 'values' in self.updated_fields:
                result['values'] = self.values

            if 'format' in self.updated_fields:
                result['format'] = self.format

            if 'can_delete' in self.updated_fields:
                result['can_delete'] = self.can_delete

            if 'can_delete' in self.updated_fields:
                result['can_delete'] = self.can_delete

            return result
        else:
            return {
                'name': self.name,
                'code': self.code,
                'group': self.group_name,
                'description': self.description,
                'values': self.values,
                'format': self.format,
                'can_delete': self.can_delete,
                'can_modify': self.can_modify
            }

    def audit_delete(self, user):
        return {
            'name': self.name
        }

    def count_num_values(self):
        """
        Counts and returns the number of values related to this descriptor according to the current language
        if there is translations otherwise the number of values.

        :return: Number of values
        :rtype: Integer
        """
        lang = translation.get_language()
        trans = self.format.get('trans', False)

        if self.values is not None:
            if trans:
                count = len(self.values.get(lang, {}))
            else:
                count = len(self.values)
        else:
            if trans:
                count = self.values_set.filter(language=lang).count()
            else:
                count = self.values_set.all().count()

        return count

    def has_values(self):
        """
        Check if there is some values for this descriptor for any languages

        :return: True if there is some values
        :rtype: Boolean
        """
        if self.values is not None:
            return len(self.values) == 0
        else:
            return self.values_set.all().exists()

    # def in_usage(self):
    #     """
    #     Check if the type of descriptor is used by some type of models of descriptors
    #     """
    #     return self.descriptor_model_types.all().exists()

    def get_label(self):
        """
        Get the label for this layout in the current regional.
        """
        lang = translation.get_language()
        return self.label.get(lang, "")

    def set_label(self, lang, label):
        """
        Set the label for a specific language.
        :param str lang: language code string
        :param str label: Localized label
        :note Model instance save() is not called.
        """
        self.label[lang] = label

    def get_values(self, sort_by='id', reverse=False, cursor=None, limit=30):
        """
        Query for a list of value ordered by id or name, with a limit of number of results.

        :return: A triplet with previous and next cursors strings and the array of values
                like {'name', 'value'} with value can be a dict.
        :rtype: tuple
        """
        lang = translation.get_language()
        trans = self.format.get('trans', False)

        prev_cursor = None
        next_cursor = None
        values_list = []

        # map fields name with columns
        fields = self.format.get('fields')
        if fields:
            if len(fields) >= 1 and sort_by == fields[0]:
                sort_by = "value0"
            elif len(fields) >= 2 and sort_by == fields[1]:
                sort_by = "value1"

        # id is code
        if sort_by == "code":
            sort_by = "id"

        # internally stored values
        if self.values is not None:
            if trans:
                pre_values = self.values
                if lang in pre_values:
                    values = pre_values[lang]
                else:
                    values = {}
            else:
                values = self.values

            if sort_by == 'id':
                # sort by id (code)
                # name are unique so its a trivial case
                if reverse:
                    cursor_code = cursor[1] if cursor else "~"

                    for k, v in values.items():
                        if k < cursor_code:
                            values_list.append({
                                'id': k,
                                'parent': v.get('parent', None),
                                'ordinal': v.get('ordinal', None),
                                'value0': v.get('value0', None),
                                'value1': v.get('value1', None),
                            })
                else:
                    cursor_code = cursor[0] if cursor else ""

                    for k, v in values.items():
                        if k > cursor_code:
                            values_list.append({
                                'id': k,
                                'parent': v.get('parent', None),
                                'ordinal': v.get('ordinal', None),
                                'value0': v.get('value0', None),
                                'value1': v.get('value1', None),
                            })

                values_list = sorted(values_list, key=lambda v: v['id'], reverse=reverse)[:limit]
            elif sort_by == 'ordinal':
                # sort by a ordinal field as integer comparison.
                # its not a trivial case because of null values and duplications.
                # blank value are not allowed.
                # null values are supported.
                # duplicated values are supported by string concatenation of ordinal+code during sorting.
                cursor_ordinal, cursor_code = cursor if cursor else (None, None)

                if cursor_code is None:
                    cursor_code = ""

                extra_list = []

                if reverse:
                    if cursor_ordinal:
                        cursor_ordinal = int(cursor_ordinal)
                    else:
                        cursor_ordinal = 999999999

                    if cursor:
                        for k, v in values.items():
                            ordinal = v.get('ordinal')

                            if ordinal is None and k > cursor_code:
                                extra_list.append({
                                    'id': k,
                                    'parent': v.get('parent', None),
                                    'ordinal': v.get('ordinal', None),
                                    'value0': v.get('value0', None),
                                    'value1': v.get('value1', None),
                                })
                            elif cursor_ordinal and ordinal and ordinal < cursor_ordinal:
                                values_list.append({
                                    'id': k,
                                    'parent': v.get('parent', None),
                                    'ordinal': v.get('ordinal', None),
                                    'value0': v.get('value0', None),
                                    'value1': v.get('value1', None),
                                })
                    else:
                        for k, v in values.items():
                            ordinal = v.get('ordinal')

                            if ordinal is None:
                                extra_list.append({
                                    'id': k,
                                    'parent': v.get('parent', None),
                                    'ordinal': v.get('ordinal', None),
                                    'value0': v.get('value0', None),
                                    'value1': v.get('value1', None),
                                })
                            else:
                                values_list.append({
                                    'id': k,
                                    'parent': v.get('parent', None),
                                    'ordinal': v.get('ordinal', None),
                                    'value0': v.get('value0', None),
                                    'value1': v.get('value1', None),
                                })
                else:
                    if cursor_ordinal:
                        cursor_ordinal = int(cursor_ordinal)
                    else:
                        cursor_ordinal = -1

                    if cursor:
                        for k, v in values.items():
                            ordinal = v.get('ordinal')

                            if ordinal is None and k > cursor_code:
                                extra_list.append({
                                    'id': k,
                                    'parent': v.get('parent', None),
                                    'ordinal': v.get('ordinal', None),
                                    'value0': v.get('value0', None),
                                    'value1': v.get('value1', None),
                                })
                            elif cursor_ordinal and ordinal and ordinal > cursor_ordinal:
                                values_list.append({
                                    'id': k,
                                    'parent': v.get('parent', None),
                                    'ordinal': v.get('ordinal', None),
                                    'value0': v.get('value0', None),
                                    'value1': v.get('value1', None),
                                })
                    else:
                        for k, v in values.items():
                            ordinal = v.get('ordinal')

                            if ordinal is None:
                                extra_list.append({
                                    'id': k,
                                    'parent': v.get('parent', None),
                                    'ordinal': v.get('ordinal', None),
                                    'value0': v.get('value0', None),
                                    'value1': v.get('value1', None),
                                })
                            else:
                                values_list.append({
                                    'id': k,
                                    'parent': v.get('parent', None),
                                    'ordinal': v.get('ordinal', None),
                                    'value0': v.get('value0', None),
                                    'value1': v.get('value1', None),
                                })

                def sort_method(v):
                    ordinal = v['ordinal']

                    if ordinal:
                        return (int(ordinal) + 1) * int(v['id'].split(':')[1])
                    else:
                        return int(v['id'].split(':')[1])

                values_list = sorted(values_list, key=sort_method, reverse=reverse)[:limit]
                extra_size = limit - len(values_list)

                if extra_size > 0:
                    extra_list = sorted(extra_list, key=lambda v: int(v['id'].split(':')[1]))[:extra_size]
                    values_list += extra_list
            else:
                # sort by a field contained in the values as string compare.
                # its not a trivial case because of null values and duplications.
                # blank value are not allowed.
                # null values are supported.
                # duplicated values are supported by string concatenation of value+code during sorting.
                cursor_value, cursor_code = cursor if cursor else (None, None)

                if cursor_code is None:
                    cursor_code = ""

                extra_list = []

                if reverse:
                    if cursor:
                        for k, v in values.items():
                            value = v.get(sort_by)

                            # if value is None:
                            #     raise SuspiciousOperation("Invalid value for field")

                            # if value is "" and k > cursor_code:
                            if value is None and k > cursor_code:
                                extra_list.append({
                                    'id': k,
                                    'parent': v.get('parent', None),
                                    'ordinal': v.get('ordinal', None),
                                    'value0': v.get('value0', None),
                                    'value1': v.get('value1', None),
                                })
                            elif cursor_value and value and value < cursor_value:
                                values_list.append({
                                    'id': k,
                                    'parent': v.get('parent', None),
                                    'ordinal': v.get('ordinal', None),
                                    'value0': v.get('value0', None),
                                    'value1': v.get('value1', None),
                                })
                    else:
                        for k, v in values.items():
                            value = v.get(sort_by)

                            # if value is None:
                            #     raise SuspiciousOperation("Invalid value for field")

                            # if value is "":
                            if value is None:
                                extra_list.append({
                                    'id': k,
                                    'parent': v.get('parent', None),
                                    'ordinal': v.get('ordinal', None),
                                    'value0': v.get('value0', None),
                                    'value1': v.get('value1', None),
                                })
                            else:
                                values_list.append({
                                    'id': k,
                                    'parent': v.get('parent', None),
                                    'ordinal': v.get('ordinal', None),
                                    'value0': v.get('value0', None),
                                    'value1': v.get('value1', None),
                                })
                else:
                    if cursor:
                        for k, v in values.items():
                            value = v.get(sort_by)

                            # if value is None:
                            #     raise SuspiciousOperation("Invalid value for field")

                            # if value is "" and k > cursor_code:
                            if value is None and k > cursor_code:
                                extra_list.append({
                                    'id': k,
                                    'parent': v.get('parent', None),
                                    'ordinal': v.get('ordinal', None),
                                    'value0': v.get('value0', None),
                                    'value1': v.get('value1', None),
                                })
                            elif cursor_value and value and value > cursor_value:
                                values_list.append({
                                    'id': k,
                                    'parent': v.get('parent', None),
                                    'ordinal': v.get('ordinal', None),
                                    'value0': v.get('value0', None),
                                    'value1': v.get('value1', None),
                                })
                    else:
                        for k, v in values.items():
                            value = v.get(sort_by)

                            # if value is None:
                            #     raise SuspiciousOperation("Invalid value for field")

                            # if value is "":
                            if value is None:
                                extra_list.append({
                                    'id': k,
                                    'parent': v.get('parent', None),
                                    'ordinal': v.get('ordinal', None),
                                    'value0': v.get('value0', None),
                                    'value1': v.get('value1', None),
                                })
                            else:
                                values_list.append({
                                    'id': k,
                                    'parent': v.get('parent', None),
                                    'ordinal': v.get('ordinal', None),
                                    'value0': v.get('value0', None),
                                    'value1': v.get('value1', None),
                                })

                def sort_method(v):
                    if v[sort_by]:
                        return v[sort_by] + v['id']
                    else:
                        return v['id']

                values_list = sorted(values_list, key=sort_method, reverse=reverse)[:limit]
                extra_size = limit - len(values_list)

                if extra_size > 0:
                    extra_list = sorted(extra_list, key=lambda v: v['id'])[:extra_size]
                    values_list += extra_list
        else:  # per row value
            if trans:
                qs = self.values_set.filter(language=lang)
            else:
                qs = self.values_set.all()

            if sort_by == 'id':
                cursor_code = cursor[1] if cursor else None

                # code is unique (per language)
                if reverse:
                    if cursor_code:
                        qs = qs.filter(code__lt=cursor_code)

                    qs = qs.order_by('-code')
                else:
                    if cursor_code:
                        qs = qs.filter(code__gt=cursor_code)

                    qs = qs.order_by('code')
            elif sort_by == 'ordinal':
                cursor_ordinal, cursor_code = cursor if cursor else (None, None)

                if cursor_ordinal:
                    cursor_ordinal = int(cursor_ordinal)

                # ordinal is unique (per language)
                if reverse:
                    if cursor_ordinal:
                        qs = qs.filter(ordinal__lt=cursor_ordinal)

                    qs = qs.order_by('-ordinal', 'code')
                else:
                    if cursor_ordinal:
                        qs = qs.filter(ordinal__gt=cursor_ordinal)

                    qs = qs.order_by('ordinal', 'code')
            elif sort_by == 'value0':
                cursor_value0, cursor_code = cursor if cursor else (None, None)

                # value0 can be non unique
                if reverse:
                    if cursor_value0:
                        qs = qs.filter(Q(value0__lt=cursor_value0) | (
                                Q(value0=cursor_value0) & Q(code__gt=cursor_code)))

                    qs = qs.order_by('-value0', 'code')
                else:
                    if cursor_value0:
                        qs = qs.filter(Q(value0__gt=cursor_value0) | (
                                Q(value0=cursor_value0) & Q(code__gt=cursor_code)))

                    qs = qs.order_by('value0', 'code')
            elif sort_by == 'value1':
                cursor_value1, cursor_code = cursor if cursor else (None, None)

                # value1 can be non unique
                if reverse:
                    if cursor_value1:
                        qs = qs.filter(Q(value1__lt=cursor_value1) | (
                                Q(value1=cursor_value1) & Q(code__gt=cursor_code)))

                    qs = qs.order_by('-value1', 'code')
                else:
                    if cursor_value1:
                        qs = qs.filter(Q(value1__gt=cursor_value1) | (
                                Q(value1=cursor_value1) & Q(code__gt=cursor_code)))

                    qs = qs.order_by('value1', 'code')

            qs = qs[:limit]

            for value in qs:
                values_list.append({
                    'id': value.code,
                    'parent': value.parent,
                    'ordinal': value.ordinal,
                    'value0': value.value0,
                    'value1': value.value1
                })

        # cursors
        if len(values_list) > 0:
            val = values_list[0]
            if val[sort_by]:
                prev_cursor = (val[sort_by], val['id'])
            else:
                prev_cursor = (None, val['id'])

            val = values_list[-1]
            if val[sort_by]:
                next_cursor = (val[sort_by], val['id'])
            else:
                next_cursor = (None, val['id'])

        return prev_cursor, next_cursor, values_list

    def get_value(self, code):
        """
        Get the ordinal, value0, value1, and parent code for a given value code
        """
        lang = translation.get_language()
        trans = self.format.get('trans', False)

        if self.values is not None:
            if trans:
                pre_values = self.values
                if lang in pre_values:
                    values = pre_values[lang]
                else:
                    values = {}
            else:
                values = self.values

            val = values.get(code)
            if val:
                return val.get('parent'), val.get('ordinal'), val.get('value0'), val.get('value1')
            else:
                raise DescriptorValue.DoesNotExist()
        else:
            if trans:
                value = get_object_or_404(DescriptorValue, Q(language=lang), Q(code=code))
            else:
                value = get_object_or_404(DescriptorValue, Q(code=code))

            return value.parent, value.ordinal, value.value0, value.value1

    def search_values(self, field_value, field_name="code", cursor=None, limit=30):
        """
        Search for values starting by value1, value2 or ordinal according to the
        descriptor code and the current language. Always in ASC order.

        :param str field_value: Value of the field to search
        :param str field_name: Name of the field to search for
        :param str cursor: Cursor position of the last previous result
        :param int limit: Number max of results
        :return: The list of values with name starting with field_value on field_name.
        """
        lang = translation.get_language()
        trans = self.format.get('trans', False)

        cursor_value, cursor_code = cursor if cursor else (None, None)

        values_list = []

        if self.values is not None:
            if trans:
                pre_values = self.values
                if lang in pre_values:
                    values = pre_values[lang]
                else:
                    values = {}
            else:
                values = self.values

            # ordinal means unique result, so no cursor/limit
            if field_name == "ordinal":
                for k, v in values.items():
                    ordinal = v.get('ordinal')

                    if ordinal == field_value:
                        values_list.append({
                            'id': k,
                            'parent': v.get('parent', None),
                            'ordinal': v.get('ordinal', None),
                            'value0': v.get('value0', None),
                            'value1': v.get('value1', None),
                        })
                        break
            elif field_name == "value0" or field_name == "value1":
                if cursor_code is None:
                    cursor_code = ""

                extra_list = []

                if cursor:
                    for k, v in values.items():
                        value = v.get(field_name)

                        # if value is None:
                        #     raise SuspiciousOperation("Invalid value for field")

                        # if value is "" and k > cursor_code:
                        if value.startswith(field_value):
                            if value is None and k > cursor_code:
                                extra_list.append({
                                    'id': k,
                                    'parent': v.get('parent', None),
                                    'ordinal': v.get('ordinal', None),
                                    'value0': v.get('value0', None),
                                    'value1': v.get('value1', None),
                                })
                            elif cursor_value and value and value > cursor_value:
                                values_list.append({
                                    'id': k,
                                    'parent': v.get('parent', None),
                                    'ordinal': v.get('ordinal', None),
                                    'value0': v.get('value0', None),
                                    'value1': v.get('value1', None),
                                })
                else:
                    for k, v in values.items():
                        value = v.get(field_name)

                        if value.startswith(field_value):
                            values_list.append({
                                'id': k,
                                'parent': v.get('parent', None),
                                'ordinal': v.get('ordinal', None),
                                'value0': v.get('value0', None),
                                'value1': v.get('value1', None),
                            })

                # values_list = sorted(values_list, key=lambda v: v[field_name])

                def sort_method(v):
                    if v[field_name]:
                        return v[field_name] + v['id']
                    else:
                        return v['id']

                values_list = sorted(values_list, key=sort_method)[:limit]
                extra_size = limit - len(values_list)

                if extra_size > 0:
                    extra_list = sorted(extra_list, key=lambda v: v['id'])[:extra_size]
                    values_list += extra_list
        else:
            if trans:
                qs = self.values_set.filter(language=lang)
            else:
                qs = self.values_set
            if field_name == "ordinal":
                # single result
                qs = qs.filter(ordinal=field_value)
            elif field_name == "value0":
                qs = qs.filter(value0__istartswith=field_value)
                if cursor_value is not None:
                    qs = qs.filter(Q(value0__gt=cursor_value) | (
                            Q(value0=cursor_value) & Q(code__gt=cursor_code)))

                qs = qs.order_by('value0', 'code')
            elif field_name == "value1":
                qs = qs.filter(value1__istartswith=field_value)
                if cursor_value is not None:
                    qs = qs.filter(Q(value1__gt=cursor_value) | (
                            Q(value1=cursor_value) & Q(code__gt=cursor_code)))

                qs = qs.order_by('value1', 'code')

            qs = qs[:limit]

            for value in qs:
                values_list.append({
                    'id': value.code,
                    'parent': value.parent,
                    'ordinal': value.ordinal,
                    'value0': value.value0,
                    'value1': value.value1
                })

        # cursors
        if len(values_list) > 0:
            val = values_list[0]
            if val[field_name]:
                prev_cursor = (val[field_name], val['id'])
            else:
                prev_cursor = (None, val['id'])

            val = values_list[-1]
            if val[field_name]:
                next_cursor = (val[field_name], val['id'])
            else:
                next_cursor = (None, val['id'])

            return prev_cursor, next_cursor, values_list
        else:
            return None, None, []

    def get_values_from_list(self, values, limit=100):
        """
        Search for values by code according to the descriptor code and the current language unsorted.

        :param str values: Values of the field to search
        :param int limit: Number max of results
        :return: The list of values.
        """
        lang = translation.get_language()
        trans = self.format.get('trans', False)

        values_list = []

        if self.values is not None:
            if trans:
                pre_values = self.values
                if lang in pre_values:
                    data_values = pre_values[lang]
                else:
                    data_values = {}
            else:
                data_values = self.values

            for value in values:
                v = data_values.get(value)
                if v:
                    values_list.append({
                        'id': value,
                        'parent': v.get('parent', None),
                        'ordinal': v.get('ordinal', None),
                        'value0': v.get('value0', None),
                        'value1': v.get('value1', None),
                    })
        else:
            if trans:
                qs = self.values_set.filter(language=lang)
            else:
                qs = self.values_set

            qs = qs.filter(code__in=values)[:limit]

            for value in qs:
                values_list.append({
                    'id': value.code,
                    'parent': value.parent,
                    'ordinal': value.ordinal,
                    'value0': value.value0,
                    'value1': value.value1
                })

        return values_list


class DescriptorValue(Entity):
    """
    For some descriptors value are in a specific table.
    Value are per language.
    A value can have a parent des
    The field name represent the code of the value according to its type.
    """

    # @todo with values
    client_cache_update = ("descriptors",)

    # Descriptor value code (unique with language)
    code = models.CharField(max_length=64)

    # A value is dedicated for a descriptor and an language
    language = models.CharField(max_length=5, default="en")

    # Related type of descriptor.
    descriptor = models.ForeignKey(Descriptor, related_name='values_set')

    # Direct parent descriptor value, in case of one level hierarchy.
    parent = models.CharField(max_length=64, null=True)

    # Ordinal with numeric value index for ordinal_with_text type of format.
    ordinal = models.IntegerField(default=0, null=True)

    # Single enumeration field, or pair enumeration first field
    value0 = models.CharField(max_length=127, default="", null=True)

    # Pair enumeration second field
    value1 = models.CharField(max_length=127, default="", null=True)

    # NULLS LAST query set manager for PostgreSQL
    objects = NullsLastQuerySet.as_manager()

    class Meta:
        verbose_name = _("descriptor value")

        unique_together = (
            ('code', 'language'),
        )

        index_together = (
            ('code', 'language'),
            ('descriptor', 'language'),
            ('descriptor', 'language', 'ordinal'),  # index for ordinals
            ('descriptor', 'language', 'value0'),  # index for value0
            ('descriptor', 'language', 'value1'),  # index for value1
        )

    def natural_name(self):
        return "%s (%s)" % (self.code, self.language)

    @classmethod
    def make_search_by_name(cls, term):
        return Q(code__istartswith=term)

    def audit_create(self, user):
        return {
            'code': self.code,
            'language': self.language,
            'descriptor': self.descriptor_id,
            'parent': self.parent,
            'ordinal': self.ordinal,
            'value0': self.value0,
            'value1': self.value1
        }

    def audit_update(self, user):
        if hasattr(self, 'updated_fields'):
            result = {'updated_fields': self.updated_fields}

            if 'parent' in self.updated_fields:
                result['parent'] = self.parent

            if 'ordinal' in self.updated_fields:
                result['ordinal'] = self.ordinal

            if 'value0' in self.updated_fields:
                result['value0'] = self.value0

            if 'value1' in self.updated_fields:
                result['value1'] = self.value1

            return result
        else:
            return {
                'parent': self.parent,
                'ordinal': self.ordinal,
                'value0': self.value0,
                'value1': self.value1
            }

    def audit_delete(self, user):
        return {
            'code': self.code
        }


# class DescriptorPanel(Entity):
#     """
#     A panel is a displayable entity that is an association of values of descriptors
#     from a model of descriptor.
#     It is only defined for a specific model of descriptor (m2m through model).
#     A layout of descriptor can have many panels.
#     The textual resources of a panel are i18nable because they are displayed for users.
#     """
#
#     server_cache_update = ("descriptor", "entity_columns")
#     client_cache_update = ("entity_columns",)
#
#     # To which layouts this panel is attached.
#     layout = models.ForeignKey('Layout', related_name='panels')
#
#     # Related model of descriptor
#     descriptor_model = models.ForeignKey('DescriptorModel', related_name='panels')
#
#     # Label of the panel (can be used for a tab, or any dialog title).
#     # It is i18nized used JSON dict with language code as key and label as string value.
#     label = JSONField(default={})
#
#     # Position priority into the display. Lesser is before. Negative value are possibles.
#     position = models.IntegerField(default=0)
#
#     class Meta:
#         verbose_name = _("descriptor panel")
#
#     def natural_name(self):
#         return self.get_label()
#
#     @classmethod
#     def make_search_by_name(cls, term):
#         lang = translation.get_language()
#         return Q(label__icontains='"%s": %s' % (lang, json.dumps(term).rstrip('"')))
#
#     def audit_create(self, user):
#         return {
#             'layout': self.layout_id,
#             'descriptor_model': self.descriptor_model_id,
#             'label': self.label,
#             'position': self.position
#         }
#
#     def audit_update(self, user):
#         if hasattr(self, 'updated_fields'):
#             result = {'updated_fields': self.updated_fields}
#
#             if 'label' in self.updated_fields:
#                 result['label'] = self.label
#
#             if 'position' in self.updated_fields:
#                 result['position'] = self.position
#
#             return result
#         else:
#             return {
#                 'label': self.label,
#                 'position': self.position
#             }
#
#     def audit_delete(self, user):
#         return {
#             'label': self.label
#         }
#
#     def get_label(self):
#         """
#         Get the label for this layout in the current regional.
#         """
#         lang = translation.get_language()
#         return self.label.get(lang, "")
#
#     def set_label(self, lang, label):
#         """
#         Set the label for a specific language.
#         :param str lang: language code string
#         :param str label: Localized label
#         :note Model instance save() is not called.
#         """
#         self.label[lang] = label


class JSONBFieldIndexType(ChoiceEnum):
    """
    Type of the index for a JSONB field.
    """

    NONE = IntegerChoice(0, 'None')
    UNIQUE_BTREE = IntegerChoice(1, 'Unique-BTree')
    BTREE = IntegerChoice(2, 'BTree')
    GIN = IntegerChoice(3, 'GIN')
    GIST = IntegerChoice(4, 'GIST')


# class DescriptorModelType(Entity):
#     """
#     This is a basic entity of the model of descriptor. It makes the relation between a panel and
#     its descriptors. And it makes the relation between him and the model of descriptor.
#     """
#
#     server_cache_update = ("descriptor", "entity_columns")
#     client_cache_update = ("entity_columns",)
#
#     # default name validator optional
#     NAME_VALIDATOR = {
#         "type": "string", "minLength": 3, "maxLength": 64, "pattern": "^[a-zA-Z0-9\-\_\.]+$"}
#
#     # default name validator optional
#     NAME_VALIDATOR_OPTIONAL = {
#         "type": "string", "minLength": 3, "maxLength": 64, "pattern": "^[a-zA-Z0-9\-\_\.]+$", "required": False}
#
#     # unique name of type of model of descriptor used for descriptors identification
#     name = models.CharField(unique=True, max_length=255, db_index=True)
#
#     # Label of the type of descriptor.
#     # It is i18nized used JSON dict with language code as key and label as string value.
#     label = JSONField(default={})
#
#     # Relate the descriptor model (one descriptor model can have many descriptor model types)
#     descriptor_model = models.ForeignKey('DescriptorModel', related_name='descriptor_model_types')
#
#     # Related type of descriptor (relate on a specific one's)
#     descriptor_type = models.ForeignKey(Descriptor, related_name='descriptor_model_types')
#
#     # Position priority into the display. Lesser is before. Negative value are possibles.
#     position = models.IntegerField(default=0)
#
#     # True if this type of descriptor is mandatory (must be defined) (model)
#     mandatory = models.BooleanField(default=False)
#
#     # Set once, read many means that the value of the descriptor can be set only at creation
#     set_once = models.BooleanField(default=False)
#
#     # Set to type of index.
#     index = models.IntegerField(default=JSONBFieldIndexType.NONE.value, choices=JSONBFieldIndexType.choices())
#
#     class Meta:
#         verbose_name = _("descriptor model type")
#
#     def natural_name(self):
#         return self.name
#
#     @classmethod
#     def make_search_by_name(cls, term):
#         return Q(name__istartswith=term)
#
#     def audit_create(self, user):
#         return {
#             'name': self.name,
#             'label': self.label,
#             'descriptor_model': self.descriptor_model_id,
#             'descriptor_type': self.descriptor_type_id,
#             'mandatory': self.mandatory,
#             'set_once': self.set_once,
#             'position': self.position
#         }
#
#     def audit_update(self, user):
#         if hasattr(self, 'updated_fields'):
#             result = {'updated_fields': self.updated_fields}
#
#             if 'name' in self.updated_fields:
#                 result['name'] = self.name
#
#             if 'label' in self.updated_fields:
#                 result['label'] = self.label
#
#             if 'mandatory' in self.updated_fields:
#                 result['mandatory'] = self.mandatory
#
#             if 'set_once' in self.updated_fields:
#                 result['set_once'] = self.set_once
#
#             if 'position' in self.updated_fields:
#                 result['position'] = self.position
#
#             return result
#         else:
#             return {
#                 'name': self.name,
#                 'label': self.label,
#                 'mandatory': self.mandatory,
#                 'set_once': self.set_once,
#                 'position': self.position
#             }
#
#     def audit_delete(self, user):
#         return {
#             'name': self.name
#         }
#
#     def get_label(self):
#         """
#         Get the label for this layout in the current regional.
#         """
#         lang = translation.get_language()
#         return self.label.get(lang, "")
#
#     def set_label(self, lang, label):
#         """
#         Set the label for a specific language.
#         :param str lang: language code string
#         :param str label: Localized label
#         :note Model instance save() is not called.
#         """
#         self.label[lang] = label
#
#     def create_or_drop_index(self, describable, db='default'):
#         """
#         Create or drop the index on the describable table, according to the current value of index for the model.
#         :param describable: Model instance
#         :param db: DB name ('default')
#         """
#         # drop previous if exists
#         if self.index != JSONBFieldIndexType.NONE.value:
#             self.drop_index(describable, db=db)
#
#         if self.index == JSONBFieldIndexType.NONE.value:
#             return self.drop_index(describable, db=db)
#         elif self.index == JSONBFieldIndexType.UNIQUE_BTREE.value:
#             return self.create_btree_index(describable, unique=True, db=db)
#         elif self.index == JSONBFieldIndexType.BTREE.value:
#             return self.create_btree_index(describable, unique=False, db=db)
#         elif self.index == JSONBFieldIndexType.GIN.value:
#             return self.create_gin_index(describable, db=db)
#         elif self.index == JSONBFieldIndexType.GIST.value:
#             return self.create_gist_index(describable, db=db)
#
#     def _make_index_name(self, table_name):
#         to_hash = "%s_%s" % (table_name, self.name)
#         index_name = codecs.encode(
#             hashlib.sha1(to_hash.encode()).digest(), 'base64')[0:-2].decode('utf-8').replace('+', '$').replace('/', '_')
#
#         return "descriptor_%s_key" % index_name
#
#     def create_btree_index(self, describable, unique=False, db='default'):
#         """
#         Create a new btree index on a field of JSONB descriptors of the given describable model.
#         :param describable: Model instance
#         :param unique: True for unique
#         :param db: DB name ('default')
#         """
#         table = describable._meta.db_table
#         index_name = self._make_index_name(table)
#
#         if unique:
#             sql = """CREATE UNIQUE INDEX %s ON %s ((descriptors->'%s'));""" % (index_name, table, self.name)
#         else:
#             sql = """CREATE INDEX %s ON %s ((descriptors->'%s'));""" % (index_name, table, self.name)
#
#         connection = connections[db]
#         with connection.cursor() as cursor:
#             cursor.execute(sql)
#
#         return True
#
#     def create_gin_index(self, describable, db='default'):
#         """
#         Create a new GIN (not unique) index on a field of JSONB descriptors of the given describable model.
#         :param describable: Model instance
#         :param db: DB name ('default')
#         """
#         table = describable._meta.db_table
#         index_name = self._make_index_name(table)
#
#         sql = """CREATE INDEX %s ON %s USING GIN ((descriptors->'%s'));""" % (index_name, table, self.name)
#
#         connection = connections[db]
#         with connection.cursor() as cursor:
#             cursor.execute(sql)
#
#         return True
#
#     def create_gist_index(self, describable, db='default'):
#         """
#         Create a new GIST (not unique) index on a field of JSONB descriptors of the given describable model.
#         :param describable: Model instance
#         :param db: DB name ('default')
#         """
#         table = describable._meta.db_table
#         index_name = self._make_index_name(table)
#
#         sql = """CREATE INDEX %s ON %s USING GIST ((descriptors->'%s'));""" % (index_name, table, self.name)
#
#         connection = connections[db]
#         with connection.cursor() as cursor:
#             cursor.execute(sql)
#
#         return True
#
#     def drop_index(self, describable, db='default'):
#         """
#         Drop an existing index of a field of JSONB descriptors of the given describable model.
#         :param describable:
#         :param db:
#         """
#         table = describable._meta.db_table
#         index_name = self._make_index_name(table)
#
#         sql = """DROP INDEX IF EXISTS %s""" % index_name
#
#         connection = connections[db]
#         with connection.cursor() as cursor:
#             cursor.execute(sql)
#
#     def count_index_usage(self, content_type):
#         """
#         Check how many users need this index. The index can only be dropped when it reach 0.
#         :return: Number of references
#         """
#         if self.index == JSONBFieldIndexType.NONE.value:
#             return 0
#
#         count = self.descriptor_model.panels.filter(layout__target=content_type).count()
#         return count
#
#     @classmethod
#     def integrity_except(cls, model_class, exception):
#         """
#         Parse and interpret the integrity exception during describable save.
#         :param model_class: Model class of the describable
#         :param exception: IntegrityError exception instance
#         :raise SuspiciousOperation with a human readable error.
#         """
#         # logger.error(repr(exception))
#
#         # duplicate constraint
#         if exception.args[0].startswith('duplicate key value violates unique constraint'):
#             field = exception.args[0].split("'")[1]
#             try:
#                 dmt = DescriptorModelType.objects.get(name=field)
#             except DescriptorModelType.DoesNotExist:
#                 raise SuspiciousOperation(_("Unable to update the %s" % str(model_class._meta.verbose_name)))
#
#             raise SuspiciousOperation(_("The value of the descriptor %s must be unique." % dmt.get_label()))
#
#         raise SuspiciousOperation(_("Unable to save the %s" % str(model_class._meta.verbose_name)))


# class DescriptorModel(Entity):
#     """
#     A model of descriptor is like a template of descriptor that is related to panels.
#     Many entities can share the same model of descriptors.
#     """
#
#     server_cache_update = ("descriptor", "entity_columns")
#     client_cache_update = ("entity_columns",)
#
#     # unique name of model of descriptor
#     name = models.CharField(unique=True, max_length=255, db_index=True)
#
#     # Verbose name describing the model of descriptor. There is no translation for this
#     # name because it is used internally by staff.
#     verbose_name = models.CharField(max_length=255, default="")
#
#     # Textual description of the model of descriptor. There is no translation like the verbose name.
#     description = models.TextField(blank=True, default="")
#
#     class Meta:
#         verbose_name = _("descriptor model")
#
#     def natural_name(self):
#         return self.name
#
#     @classmethod
#     def make_search_by_name(cls, term):
#         return Q(name__istartswith=term)
#
#     @classmethod
#     def get_defaults_columns(cls):
#         return {
#             'name': {
#                 'label': _('Name'),
#                 'query': False,
#                 'format': {
#                     'type': 'string',
#                     'model': 'descriptor.descriptormodel'
#                 },
#                 'available_operators': ['isnull', 'notnull', 'eq', 'neq', 'icontains']
#             },
#             'verbose_name': {
#                 'label': _('Verbose name'),
#                 'query': False,
#                 'format': {
#                     'type': 'string'
#                 },
#                 'available_operators': ['isnull', 'notnull', 'eq', 'neq', 'icontains']
#             },
#             'description': {
#                 'label': _('Description'),
#                 'query': False,
#                 'format': {
#                     'type': 'string'
#                 },
#                 'available_operators': ['isnull', 'notnull', 'eq', 'neq', 'icontains']
#             },
#             'num_descriptor_model_types': {
#                 'label': _('Types'),
#                 'field': 'descriptor_model_types',
#                 'query': False,
#                 'format': {
#                     'type': 'count',
#                     'fields': ['descriptor_model_types']
#                 }
#             },
#         }
#
#     def audit_create(self, user):
#         return {
#             'name': self.name,
#             'verbose_name': self.verbose_name,
#             'description': self.description
#         }
#
#     def audit_update(self, user):
#         if hasattr(self, 'updated_fields'):
#             result = {'updated_fields': self.updated_fields}
#
#             if 'name' in self.updated_fields:
#                 result['name'] = self.name
#
#             if 'verbose_name' in self.updated_fields:
#                 result['verbose_name'] = self.verbose_name
#
#             if 'description' in self.updated_fields:
#                 result['description'] = self.description
#
#             return result
#         else:
#             return {
#                 'name': self.name,
#                 'verbose_name': self.verbose_name,
#                 'description': self.description
#             }
#
#     def audit_delete(self, user):
#         return {
#             'name': self.name
#         }
#
#     def in_usage(self):
#         """
#         Check if some entities uses of this model
#         """
#         if self.panels.exists():
#             from django.apps import apps
#             describable_entities = apps.get_app_config('descriptor').describable_entities
#
#             # @todo could be optimized ?
#             for panel in self.panels.all():
#                 layout = panel.layout
#
#                 for de in describable_entities:
#                     field_name = de._meta.model_name + '_set'
#
#                     attr = getattr(layout, field_name)
#                     if attr and attr.filter(layout=layout).exists():
#                         return True
#
#             return False
#
#         return False


class Layout(Entity):
    """
    A layout regroup many models of descriptors and many panels of descriptors.
    Some entities inherit of one of this model, in way to defines what descriptors are used,
    and how they are displayed.
    """

    # todo: precise validator schema (descriptor sections, conditions..)
    STRUCTURE_VALIDATOR = {
        "type": "object",
        "properties": {
            "panels": {
                "type": "array",
                "items": [
                    {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "descriptors": {"type": "array"}
                        }
                    }
                ]
            }
        }
    }

    server_cache_update = ("descriptor", "entity_columns")

    def on_client_cache_update(self):
        return [{
            'category': 'entity_columns',
            'name': ".".join(self.target.natural_key()) + "*",
            'values': None
        }]

    # unique name of layout of descriptor
    name = models.CharField(unique=True, max_length=255, db_index=True)

    # Target entity type (generally a describable entity).
    target = models.ForeignKey(ContentType, editable=False, related_name='layouts')

    # Label of the layout of descriptor.
    # It is i18nized used JSON dict with language code as key and label as string value.
    label = JSONField(default={})

    # Textual description of the model of descriptor. There is no translation. It is for staff usage.
    description = models.TextField(blank=True, default="")

    # List of model of descriptor attached to this layout through panel of descriptor for label and position.
    # descriptor_models = models.ManyToManyField(
    #     DescriptorModel,
    #     related_name='layouts',
    #     through=DescriptorPanel)

    # Descriptors display and conditions
    layout_content = JSONField(default={"type": "undefined"})

    # layout parameters
    parameters = JSONField(default={"type": "undefined"})

    class Meta:
        verbose_name = _("layout")

    def natural_name(self):
        return self.name

    @classmethod
    def make_search_by_name(cls, term):
        return Q(name__istartswith=term)

    def get_label(self):
        """
        Get the label for this layout in the current regional.
        """
        lang = translation.get_language()
        return self.label.get(lang, "")

    def set_label(self, lang, label):
        """
        Set the label for a specific language.
        :param str lang: language code string
        :param str label: Localized label
        :note Model instance save() is not called.
        """
        self.label[lang] = label

    def in_usage(self):
        """
        Check if some entities use of this layout
        """
        from django.apps import apps
        describable_entities = apps.get_app_config('descriptor').describable_entities

        # @todo could be optimized ?
        for de in describable_entities:
            field_name = de._meta.model_name + '_set'

            attr = getattr(self, field_name)
            if attr and attr.filter(layout=self).exists():
                return True

            return False

        return False

    def audit_create(self, user):
        return {
            'name': self.name,
            'target': self.target_id,
            'label': self.label,
            'description': self.description
        }

    def audit_update(self, user):
        if hasattr(self, 'updated_fields'):
            result = {'updated_fields': self.updated_fields}

            if 'name' in self.updated_fields:
                result['name'] = self.name

            if 'target' in self.updated_fields:
                result['target'] = self.target_id

            if 'label' in self.updated_fields:
                result['label'] = self.label

            if 'description' in self.updated_fields:
                result['description'] = self.description

            return result
        else:
            return {
                'name': self.name,
                'target': self.target_id,
                'label': self.label,
                'description': self.description
            }

    def audit_delete(self, user):
        return {
            'name': self.name
        }


class DescriptorCondition(ChoiceEnum):
    """
    Type of condition for the descriptor model type condition.
    """

    UNDEFINED = IntegerChoice(0, _('Undefined'))
    DEFINED = IntegerChoice(1, _('Defined'))
    EQUAL = IntegerChoice(2, _('Equal to'))
    NOT_EQUAL = IntegerChoice(3, _('Different from'))


# class DescriptorModelTypeCondition(Entity):
#     """
#     Condition for a type of model of descriptor.
#     """
#
#     server_cache_update = ("descriptor", "entity_columns")
#     client_cache_update = ("entity_columns",)
#
#     # related descriptor model type
#     descriptor_model_type = models.ForeignKey(DescriptorModelType, related_name='conditions')
#
#     # type of the condition
#     condition = models.IntegerField(default=DescriptorCondition.UNDEFINED.value, choices=DescriptorCondition.choices())
#
#     # target descriptor model type (of the same descriptor model)
#     target = models.ForeignKey(DescriptorModelType, related_name='conditions_as_target')
#
#     # JSON encoded values. It can be empty, # or a single value, or an array of values.
#     # The value can be true or false if the target is boolean, or can be a value code if the target is an enum
#     values = JSONField(default=None, null=True, blank=True)
#
#     class Meta:
#         verbose_name = _("descriptor model type condition")


class TransformMeta(type):
    def __init__(cls, *args):
        super(TransformMeta, cls).__init__(*args)
        cls.lookup_name = "as_%s" % (cls.lookup_type or cls.type)

        if cls.__name__ != "AsTransform":
            JSONField.register_lookup(cls)


class AsTransform(Transform, metaclass=TransformMeta):
    type = None
    lookup_type = None
    field_type = None

    def as_sql(self, qn, connection):
        lhs, params = qn.compile(self.lhs)
        splited = lhs.split("->")
        lhs = "->>".join(["->".join(splited[:-1]), splited[-1]])
        return "CAST(%s as %s)" % (lhs, self.type), params

    @property
    def output_field(self):
        return self.field_type()


# Fixture to support the as_text operator on JSON field, in way to perform any text operator like icontains...
class JsonAsText(AsTransform):
    type = "text"
    field_type = models.CharField


class DescribableEntity(Entity):
    """
    Base entity than have descriptor values and uses of a layout of descriptor.
    """

    # JSONB field containing the list of descriptors model type id as key, with a descriptor value or value code.
    descriptors = JSONField(default={})

    # It refers to a set of models of type of descriptors through a layout of descriptor.
    layout = models.ForeignKey(Layout)

    class Meta:
        abstract = True
