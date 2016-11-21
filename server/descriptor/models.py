# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
coll-gate descriptor module models.
"""
import json

from django.contrib.contenttypes.models import ContentType
from django.contrib.postgres.fields import HStoreField
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import translation
from django.utils.translation import ugettext_lazy as _

from main.models import Languages, Entity

from django.db import connections, models
from django.db.models.sql.compiler import SQLCompiler


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


class DescriptorGroup(Entity):
    """
    Category of a type of descriptor.
    """

    # Is this group of descriptors can be deleted when it is empty
    can_delete = models.BooleanField(default=True)
    # Is this group of descriptors can be modified (rename, add/remove descriptors)
    # by an authorized staff people
    can_modify = models.BooleanField(default=True)

    class Meta:
        verbose_name = _("descriptor group")


class DescriptorType(Entity):
    """
    Type of descriptor for a model.
    """

    # code can be a Crop Ontology ('CO_XYZ') code (see http://www.cropontology.org/ontology)
    # and http://www.cropontology.org/get-ontology/CO_[0-9]{3,} to get a JSON version.
    # Internals codes are prefixed by 'XY_' where 'XY' is 'IN' for initials values.
    code = models.CharField(unique=True, max_length=64)

    # default should belong to the general group.
    group = models.ForeignKey(DescriptorGroup, related_name='types_set')

    # informative description.
    description = models.TextField(blank=True, default="")

    # JSON encoded values (mostly a dict or empty). Value are classified by language at the first
    # level of JSON dict.
    values = models.TextField(default="")

    # JSON encoded format of the descriptor
    format = models.TextField(
        default='{"type": "string", "unit": "custom", "precision": "0.0", "fields": [], "trans": false}')

    # Is this descriptor can be deleted by an authorised staff people
    can_delete = models.BooleanField(default=True)
    # Is this descriptor can be modified (rename, add/remove/modify its values)
    # by an authorised staff people
    can_modify = models.BooleanField(default=True)

    def count_num_values(self):
        """
        Counts and returns the number of values related to this descriptor according to the current language
        if there is translations otherwise the number of values.

        :return: Number of values
        :rtype: Integer
        """
        descriptor_format = json.loads(self.format)
        lang = translation.get_language()
        trans = descriptor_format.get('trans', False)

        if self.values:
            values = json.loads(self.values)

            if trans:
                count = len(values.get(lang, {}))
            else:
                count = len(values)
        else:
            if trans:
                count = self.values_set.filter(language=lang).count()
            else:
                count = self.values_set.all().count()

        return count

    class Meta:
        verbose_name = _("descriptor type")

    def has_values(self):
        """
        Check if there is some values for this descriptor for any languages

        :return: True if there is somes values
        :rtype: Boolean
        """
        if self.values:
            values = json.loads(self.values)

            return len(values) == 0
        else:
            return self.values_set.all().exists()

    def in_usage(self):
        """
        Check if the type of descriptor is used by some type of models of descriptors
        """
        return self.descriptor_model_types.all().exists()

    # @property
    # def _format_cache(self):
    #     """
    #     Format cache.
    #     @todo reload if self.format changes.
    #     """
    #     if not self._format_cache:
    #         self._format_cache = json.load(self.format)
    #     return self._format_cache

    def get_values(self, sort_by='id', reverse=False, cursor=None, limit=30):
        """
        Query for a list of value ordered by id or name, with a limit of number of results.

        :return: A triplet with previous and next cursors strings and the array of values
                like {'name', 'value'} with value can be a dict.
        :rtype: tuple
        """
        format = json.loads(self.format)
        lang = translation.get_language()
        trans = format.get('trans', False)

        prev_cursor = None
        next_cursor = None
        values_list = []

        # map fields name with columns
        fields = format.get('fields', [])
        if fields:
            if sort_by == fields[0]:
                sort_by = "value0"
            elif sort_by == fields[1]:
                sort_by = "value1"

        # internally stored values
        if self.values:
            if trans:
                pre_values = json.loads(self.values)
                if lang in pre_values:
                    values = pre_values[lang]
                else:
                    values = {}
            else:
                values = json.loads(self.values)

            if sort_by == 'id':
                # sort by id (code)
                # name are unique so its a trivial case
                if reverse:
                    next_code = str(cursor.split('/')[0]) if cursor else "ZZ_9999:99999999"

                    for k, v in values.items():
                        if k < next_code:
                            values_list.append({
                                'id': k,
                                'parent': v.get('parent', None),
                                'ordinal': v.get('ordinal', None),
                                'value0': v.get('value0', None),
                                'value1': v.get('value1', None),
                            })
                else:
                    next_code = str(cursor.split('/')[0]) if cursor else ""

                    for k, v in values.items():
                        if k > next_code:
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
                next_ordinal, next_code = cursor.split('/') if cursor else (None, None)

                if next_code is None:
                    next_code = ""

                extra_list = []

                if reverse:
                    if next_ordinal:
                        next_ordinal = int(next_ordinal)
                    else:
                        next_ordinal = 999999999

                    if cursor:
                        for k, v in values.items():
                            ordinal = v.get('ordinal')

                            if ordinal is None and k > next_code:
                                extra_list.append({
                                    'id': k,
                                    'parent': v.get('parent', None),
                                    'ordinal': v.get('ordinal', None),
                                    'value0': v.get('value0', None),
                                    'value1': v.get('value1', None),
                                })
                            elif next_ordinal and ordinal and ordinal < next_ordinal:
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
                    if next_ordinal:
                        next_ordinal = int(next_ordinal)
                    else:
                        next_ordinal = -1

                    if cursor:
                        for k, v in values.items():
                            ordinal = v.get('ordinal')

                            if ordinal is None and k > next_code:
                                extra_list.append({
                                    'id': k,
                                    'parent': v.get('parent', None),
                                    'ordinal': v.get('ordinal', None),
                                    'value0': v.get('value0', None),
                                    'value1': v.get('value1', None),
                                })
                            elif next_ordinal and ordinal and ordinal > next_ordinal:
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
                        return (int(ordinal)+1) * int(v['id'].split(':')[1])
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
                next_value, next_code = cursor.split('/') if cursor else (None, None)

                if next_code is None:
                    next_code = ""

                extra_list = []

                if reverse:
                    if cursor:
                        for k, v in values.items():
                            value = v.get(sort_by)

                            # if value is None:
                            #     raise SuspiciousOperation("Invalid value for field")

                            # if value is "" and k > next_code:
                            if value is None and k > next_code:
                                extra_list.append({
                                    'id': k,
                                    'parent': v.get('parent', None),
                                    'ordinal': v.get('ordinal', None),
                                    'value0': v.get('value0', None),
                                    'value1': v.get('value1', None),
                                })
                            elif next_value and value and value < next_value:
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

                            # if value is "" and k > next_code:
                            if value is None and k > next_code:
                                extra_list.append({
                                    'id': k,
                                    'parent': v.get('parent', None),
                                    'ordinal': v.get('ordinal', None),
                                    'value0': v.get('value0', None),
                                    'value1': v.get('value1', None),
                                })
                            elif next_value and value and value > next_value:
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
                        return v[sort_by]+v['id']
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
                next_code = str(cursor.split('/')[0]) if cursor else None

                if reverse:
                    if next_code:
                        qs = qs.filter(code__lt=next_code).order_by('-code')
                    else:
                        qs = qs.order_by('-code')
                else:
                    if next_code:
                        qs = qs.filter(code__gt=next_code).order_by('code')
                    else:
                        qs = qs.order_by('code')
            elif sort_by == 'ordinal':
                next_ordinal, next_code = cursor.split('/') if cursor else (None, None)

                if next_ordinal:
                    next_ordinal = int(next_ordinal)

                if reverse:
                    if next_ordinal:
                        qs = qs.filter(ordinal__lt=next_ordinal).order_by('-ordinal', 'code')
                    elif next_code:
                        qs = qs.filter(code__gt=next_code).order_by('-ordinal', 'code')
                    else:
                        qs = qs.order_by('-ordinal', 'code')
                else:
                    if next_ordinal:
                        qs = qs.filter(ordinal__gt=next_ordinal).order_by('ordinal', 'code')
                    elif next_code:
                        qs = qs.filter(code__gt=next_code).order_by('ordinal', 'code')
                    else:
                        qs = qs.order_by('ordinal', 'code')
            elif sort_by == 'value0':
                next_value0, next_code = cursor.split('/') if cursor else (None, None)

                if reverse:
                    if next_value0:
                        qs = qs.filter(value0__lt=next_value0).order_by('-value0', 'code')
                    elif next_code:
                        qs = qs.filter(code__gt=next_code).order_by('-value0', 'code')
                    else:
                        qs = qs.order_by('-value0', 'code')
                else:
                    if next_value0:
                        qs = qs.filter(value0__gt=next_value0).order_by('value0', 'code')
                    elif next_code:
                        qs = qs.filter(code__gt=next_code).order_by('value0', 'code')
                    else:
                        qs = qs.order_by('value0', 'code')
            elif sort_by == 'value1':
                next_value1, next_code = cursor.split('/') if cursor else (None, None)

                if reverse:
                    if next_value1:
                        qs = qs.filter(value1__lt=next_value1).order_by('-value1', 'code')
                    elif next_code:
                        qs = qs.filter(code__gt=next_code).order_by('-value1', 'code')
                    else:
                        qs = qs.order_by('-value1', 'code')
                else:
                    if next_value1:
                        qs = qs.filter(value1__gt=next_value1).order_by('value1', 'code')
                    elif next_code:
                        qs = qs.filter(code__gt=next_code).order_by('value1', 'code')
                    else:
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
                prev_cursor = "%s/%s" % (val[sort_by], val['id'])
            else:
                prev_cursor = "/%s" % val['id']

            val = values_list[-1]
            if val[sort_by]:
                next_cursor = "%s/%s" % (val[sort_by], val['id'])
            else:
                next_cursor = "/%s" % val['id']

        return prev_cursor, next_cursor, values_list

    def get_value(self, code):
        """
        Get the ordinal, value0, value1, and parent code for a given value code
        """
        format = json.loads(self.format)
        lang = translation.get_language()
        trans = format.get('trans', False)

        if self.values:
            if trans:
                pre_values = json.loads(self.values)
                if lang in pre_values:
                    values = pre_values[lang]
                else:
                    values = {}
            else:
                values = json.loads(self.values)

            val = values.get(code)
            if val:
                return val.get('parent'), val.get('ordinal'), val.get('value0'), val.get('value1')
            else:
                raise DescriptorValue.DoesNotExist()
        else:
            if trans:
                value = get_object_or_404(DescriptorValue, Q(language=lang), Q(code=code))
            else:
                value = get_object_or_404(DescriptorValue, Q(language__is_null=True), Q(code=code))

            return value.parent, value.ordinal, value.value0, value.value1

    def search_values(self, field_value, field_name="code"):
        """
        Search for values starting by value1, value2 or ordinal according to the
        descriptor code and the current language.

        :param value:
        :return: The list of values with name starting with field_value on field_name.
        """
        format = json.loads(self.format)
        lang = translation.get_language()
        trans = format.get('trans', False)

        values_list = []

        if self.values:
            if trans:
                pre_values = json.loads(self.values)
                if lang in pre_values:
                    values = pre_values[lang]
                else:
                    values = {}
            else:
                values = json.loads(self.values)

            if field_name == "ordinal":
                for value in values:
                    if value.ordinal == field_value:
                        values_list.append({
                            'code': value.code,
                            'parent': value.parent,
                            'oridinal': value.ordinal,
                            'value0': value.value0,
                            'value1': value.value1
                        })
                        break
            elif field_name == "value0":
                for value in values:
                    if value.value0.startswith(field_value):
                        values_list.append({
                            'code': value.code,
                            'parent': value.parent,
                            'oridinal': value.ordinal,
                            'value0': value.value0,
                            'value1': value.value1
                        })
                values_list = sorted(values_list, key=lambda v: v['value0'])

            elif field_name == "value1":
                for value in values:
                    if value.value1.startswith(field_value):
                        values_list.append({
                            'code': value.code,
                            'parent': value.parent,
                            'oridinal': value.ordinal,
                            'value0': value.value0,
                            'value1': value.value1
                        })
                values_list = sorted(values_list, key=lambda v: v['value0'])
        else:
            if trans:
                qs = DescriptorValue.object.filter(language=lang)
            else:
                qs = DescriptorValue.object

            if field_name == "ordinal":
                qs = qs.filter(ordinal=field_value)
            elif field_name == "value0":
                qs = qs.filter(value0__istartswith=field_value)
                qs = qs.order_by('value0')
            elif field_name == "value1":
                qs = qs.filter(value1__istartswith=field_value)
                qs = qs.order_by('value1')

            for value in qs:
                values_list.append({
                    'code': value.code,
                    'parent': value.parent,
                    'oridinal': value.ordinal,
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

    # A value is dedicated for a descriptor and an language
    language = models.CharField(max_length=8, choices=Languages.choices(), default=Languages.EN.value)

    # Descriptor value code (unique with language)
    code = models.CharField(max_length=64)

    # Related type of descriptor.
    descriptor = models.ForeignKey(DescriptorType, related_name='values_set')

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
            ('descriptor', 'language', 'value0'),   # index for value0
            ('descriptor', 'language', 'value1'),   # index for value1
        )


class DescriptorPanel(Entity):
    """
    A panel is a displayable entity that is an association of values of descriptors
    from a model of descriptor.
    It is only defined for a specific model of descriptor (m2m through model).
    A meta-model of descriptor can have many panels.
    The textual resources of a panel are i18nable because they are displayed for users.
    """

    # To which meta-models this panel is attached.
    descriptor_meta_model = models.ForeignKey('DescriptorMetaModel', related_name='panels')

    # Related model of descriptor
    descriptor_model = models.ForeignKey('DescriptorModel', related_name='panels')

    # Label of the panel (can be used for a tab, or any dialog title).
    # It is i18nized used JSON dict with language code as key and label as value (string:string).
    label = models.TextField(default="{}")

    # Position priority into the display. Lesser is before. Negative value are possibles.
    position = models.IntegerField(default=0)

    class Meta:
        verbose_name = _("descriptor panel")

    def get_label(self):
        """
        Get the label for this panel in the current regional.
        """
        data = json.loads(self.label)
        lang = translation.get_language()

        return data.get(lang, "")

    def set_label(self, lang, label):
        """
        Set the label for a specific language.
        :param str lang: language code string
        :param str label: Localized label
        :note Model instance save() is not called.
        """
        data = json.loads(self.label)
        data[lang] = label
        self.label = json.dumps(data)


class DescriptorModelType(Entity):
    """
    This is a basic entity of the model of descriptor. It makes the relation between a panel and
    its descriptors. And it makes the relation between him and the model of descriptor.
    """

    # Label of the type of descriptor.
    # It is i18nized used JSON dict with language code as key and label as value (string:string).
    label = models.TextField(default="{}")

    # Relate the descriptor model (one descriptor model can have many descriptor model types)
    descriptor_model = models.ForeignKey('DescriptorModel', related_name='descriptor_model_types')

    # Related type of descriptor (relate on a specific one's)
    descriptor_type = models.ForeignKey(DescriptorType, related_name='descriptor_model_types')

    # True if this type of descriptor is mandatory (must be defined) (model)
    mandatory = models.BooleanField(default=False)

    # Set once, read many means that the value of the descriptor can be set only at creation
    set_once = models.BooleanField(default=False)

    # Position priority into the display. Lesser is before. Negative value are possibles.
    position = models.IntegerField(default=0)

    class Meta:
        verbose_name = _("descriptor model type")

    def get_label(self):
        """
        Get the label for this panel in the current regional.
        """
        data = json.loads(self.label)
        lang = translation.get_language()

        return data.get(lang, "")

    def set_label(self, lang, label):
        """
        Set the label for a specific language.
        :param str lang: language code string
        :param str label: Localized label
        :note Model instance save() is not called.
        """
        data = json.loads(self.label)
        data[lang] = label
        self.label = json.dumps(data)


class DescriptorModel(Entity):
    """
    A model of descriptor is like a template of descriptor that is related to panels.
    Many entities can share the same model of descriptors.
    """

    # Verbose name describing the model of descriptor. There is no translation for this
    # name because it is used internally by staff.
    verbose_name = models.CharField(max_length=255, default="")

    # Textual description of the model of descriptor. There is no translation like the verbose name.
    description = models.TextField(blank=True, default="")

    class Meta:
        verbose_name = _("descriptor model")

    def in_usage(self):
        """
        Check if some entities uses of this model
        """
        if self.panels.exists():
            from django.apps import apps
            describable_entities = apps.get_app_config('descriptor').describable_entities

            # @todo could be optimized ?
            for panel in self.panels.all():
                meta_model = panel.descriptor_meta_model

                for de in describable_entities:
                    field_name = de._meta.model_name + '_set'

                    attr = getattr(meta_model, field_name)
                    if attr and attr.filter(descriptor_meta_model=meta_model).exists():
                        return True

            return False

        return False


class DescriptorMetaModel(Entity):
    """
    A meta model regroup many models of descriptors and many panels of descriptors.
    Some entities inherit of one of this model, in way to defines what descriptors are used,
    and how they are displayed.
    """

    # Target entity type (generally accession, batch or sample).
    target = models.ForeignKey(ContentType, editable=False, related_name='descriptor_meta_models')

    # Label of the meta model of descriptor.
    # It is i18nized used JSON dict with language code as key and label as value (string:string).
    label = models.TextField(default="{}")

    # Textual description of the model of descriptor. There is no translation. It is for staff usage.
    description = models.TextField(blank=True, default="")

    # List of model of descriptor attached to this meta model through panel of descriptor for label and position.
    descriptor_models = models.ManyToManyField(
        DescriptorModel,
        related_name='descriptor_meta_models',
        through=DescriptorPanel)

    class Meta:
        verbose_name = _("descriptor meta model")

    def get_label(self):
        """
        Get the label for this meta model in the current regional.
        """
        data = json.loads(self.label)
        lang = translation.get_language()

        return data.get(lang, "")

    def set_label(self, lang, label):
        """
        Set the label for a specific language.
        :param str lang: language code string
        :param str label: Localized label
        :note Model instance save() is not called.
        """
        data = json.loads(self.label)
        data[lang] = label
        self.label = json.dumps(data)

    def in_usage(self):
        """Check if some entities use of this meta-model"""
        from django.apps import apps
        describable_entities = apps.get_app_config('descriptor').describable_entities

        # @todo could be optimized ?
        for de in describable_entities:
            field_name = de._meta.model_name + '_set'

            attr = getattr(self, field_name)
            if attr and attr.filter(descriptor_meta_model=self).exists():
                return True

            return False

        return False


class DescribableEntity(Entity):
    """
    Base entity than have descriptor values and uses of a meta-model of descriptor.
    """

    # HStore contains the list of descriptors code as key, and descriptor value or value code as
    # value of the dict.
    descriptors = HStoreField()

    # It refers to a set of models of type of descriptors through a meta-model of descriptor.
    descriptor_meta_model = models.ForeignKey(DescriptorMetaModel)

    class Meta:
        abstract = True
