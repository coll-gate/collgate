# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
coll-gate accession module models.
"""
import json

from django.core.exceptions import SuspiciousOperation
from django.db import models
from django.contrib.postgres.fields import HStoreField
from django.utils import translation
from django.utils.translation import ugettext_lazy as _

from igdectk.common.models import ChoiceEnum, IntegerChoice

from main.models import Languages, Entity

from django.db import connections, models
from django.db.models.sql.compiler import SQLCompiler


class NullsLastSQLCompiler(SQLCompiler):
    def get_order_by(self):
        result = super().get_order_by()
        if result and self.connection.vendor == 'postgresql':
            res = [(expr, (sql + ' NULLS LAST', params, is_ref))
                    for (expr, (sql, params, is_ref)) in result]
            print(res)
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
    Category of a type of descriptor for an accession.
    """

    # Is this group of descriptor can be deleted when it is empty
    can_delete = models.BooleanField(default=True)
    # Is this group of descriptor can be modified (rename, add/remove descriptors)
    # by an authorized staff people
    can_modify = models.BooleanField(default=True)

    class Meta:
        verbose_name = _("descriptor group")


class DescriptorType(Entity):
    """
    Type of descriptor for an accession.
    Mostly related to a Crop Ontology code.
    """

    # code can be a Crop Ontology ('CO_XYZ') code (see http://www.cropontology.org/ontology)
    # and http://www.cropontology.org/get-ontology/CO_[0-9]{3,} to get a JSON version.
    # Internals codes are prefixed by 'ID_'.
    code = models.CharField(unique=True, max_length=64, null=False, blank=False)

    # default should belong to the general group.
    group = models.ForeignKey(DescriptorGroup, null=False, related_name='types_set')

    # informative description.
    description = models.TextField()

    # JSON encoded values (mostly a dict or empty). Value are classified by language at the first
    # level of JSON dict.
    values = models.TextField(default="", null=False)

    # JSON encoded format of the descriptor
    format = models.TextField(
        default='{"type": "string", "unit": "custom", "precision": "0.0", "fields": [], "trans": false}',
        null=False,
        blank=False)

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
                    if v['ordinal']:
                        return v['ordinal']+v['id']
                    else:
                        return v['id']

                values_list = sorted(values_list, key=sort_method, reverse=reverse)[:limit]
                extra_size = limit - len(values_list)

                if extra_size > 0:
                    extra_list = sorted(extra_list, key=lambda v: v['id'])[:extra_size]
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


class DescriptorValue(Entity):
    """
    For some descriptors value are in a specific table.
    Value are per language.
    A value can have a parent des
    The field name represent the code of the value according to its type.
    """

    # A value is dedicated for a descriptor and an language
    language = models.CharField(
        null=False,
        blank=False,
        max_length=8,
        choices=Languages.choices(),
        default=Languages.EN.value)

    # Descriptor value code (unique with language)
    code = models.CharField(max_length=64, null=False, blank=False)

    # Related type of descriptor.
    descriptor = models.ForeignKey(DescriptorType, null=False, related_name='values_set')

    # Direct parent descriptor value, in case of one level hierarchy.
    parent = models.CharField(max_length=64, null=True, blank=False)

    # Ordinal with numeric value index for ordinal_with_text type of format.
    ordinal = models.IntegerField(default=0, null=True, blank=False)

    # Single enumeration field, or pair enumeration first field
    value0 = models.CharField(max_length=127, default="", null=True, blank=False)

    # Pair enumeration second field
    value1 = models.CharField(max_length=127, default="", null=True, blank=False)

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


class AccessionSynonym(Entity):
    """
    Table specific to accession to defines the synonyms.
    """

    language = models.CharField(
        null=False,
        blank=False,
        max_length=8,
        choices=Languages.choices(),
        default=Languages.EN.value)

    # Type of synonym is related to the type of descriptor IN_001 that is an 'enum_single'.
    type = models.CharField(max_length=64, null=False, blank=False, default='IN_001:0000001')

    class Meta:
        verbose_name = _("accession synonym")


class DescriptorPanel(Entity):
    """
    A panel is a displayable entity that is a association of values of descriptors.
    It is only defined for a specific model of descriptor (one to many relation).
    There is many panels per model of descriptor.
    It has many types of models of descriptors. For example we can have a general panel,
    a passport panel...
    Panels are created and modified by staff people.
    The textual resources of a panel are i18nable because they are displayed for users.
    """

    # To which meta model this panel is attached.
    descriptor_meta_model = models.ForeignKey('DescriptorMetaModel', related_name='panels', null=False)

    # Label of the panel (can be used for a tab, or any dialog title).
    # It is i18nized used JSON dict with language code as key and label as value (string:string).
    label = models.TextField(null=False, default={})

    # Position priority into the display. Lesser is before. Negative value are possibles.
    position = models.IntegerField(null=False, default=0)

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


class DescriptorModelType(models.Model):
    """
    This is a basic entity of the model of descriptor. It makes the relation between a panel and
    its descriptors. And it makes the relation between him and the model of descriptor.
    """

    # Label of the type of descriptor.
    # It is i18nized used JSON dict with language code as key and label as value (string:string).
    label = models.TextField(null=False, default={})

    # Relate the descriptor model (one descriptor model can have many descriptor model types)
    descriptor_model = models.ForeignKey('DescriptorModel', related_name='descriptors_types')

    # Related type of descriptor (relate on a specific one's)
    descriptor_type = models.ForeignKey(DescriptorType, null=False, blank=False)

    # True if this type of descriptor is mandatory for an accession (model)
    mandatory = models.BooleanField(null=False, blank=False, default=False)

    # Set once, read many means that the value of the descriptor can be set only at creation
    set_once = models.BooleanField(null=False, blank=False, default=False)

    # Position priority into the display. Lesser is before. Negative value are possibles.
    position = models.IntegerField(null=False, default=0)

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
    A model of descriptor is like a template of descriptor that is related to a kind of accession.
    Many accession can share the same model of descriptors.
    """

    # Verbose name describing the model of descriptor. There is no translation for this
    # name because it is used internally by staff.
    verbose_name = models.CharField(null=False, max_length=255, default="")

    # Textual description of the model of descriptor. There is no translation like the verbose name.
    description = models.TextField(null=False, blank=True, default="")

    class Meta:
        verbose_name = _("descriptor model")


class Asset(Entity):
    """
    Defines a collection of accessions, with particular permissions on it.
    """

    accessions = models.ManyToManyField('Accession', related_name='assets')

    class Meta:
        verbose_name = _("panel")


class DescriptorMetaModel(Entity):
    """
    A meta model regroup many models of descriptors and many panels of descriptors.
    Accession inherit of one of this model, in way to defines what descriptors are used,
    and how they are displayed.
    """

    # Label of the meta model of descriptor.
    # It is i18nized used JSON dict with language code as key and label as value (string:string).
    label = models.TextField(null=False, default={})

    # Textual description of the model of descriptor. There is no translation. It is for staff usage.
    description = models.TextField(null=False, blank=True, default="")

    # List of model of descriptor attached to this meta model.
    # The model of descriptors can be shared between many meta models.
    descriptor_models = models.ManyToManyField(DescriptorModel, related_name='descriptor_meta_model')

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


class Accession(Entity):
    """
    Accession entity defines a physical or virtual accession.
    """

    # HStore contains the list of descriptors code as key, and descriptor value or value code as
    # value of the dict.
    descriptors = HStoreField()

    # Can have many synonyms, and some synonyms can sometimes be shared by multiples accessions.
    synonyms = models.ManyToManyField(AccessionSynonym, related_name='accessions')

    # It refers to a model of type of descriptors related by a specific accession.
    # An accession can only refers to a single meta model.
    descriptor_meta_model = models.ForeignKey(DescriptorMetaModel, related_name='accessions')

    class Meta:
        verbose_name = _("accession")


class Batch(Entity):
    """
    Lot for an accession.
    """

    accession = models.ForeignKey('Accession', null=False, related_name='bundles')

    descriptors = HStoreField()

    # It refers to a model of type of descriptors related by a specific batch.
    # A batch can only refers to a single meta model.
    descriptor_meta_model = models.ForeignKey(DescriptorMetaModel, related_name='batches')

    class Meta:
        verbose_name = _("batch")


class Sample(models.Model):
    """
    Sample during lot processing.
    """

    name = models.CharField(unique=True, null=False, blank=False, max_length=255, db_index=True)
    batch = models.ForeignKey('Batch', null=False, related_name='samples')

    descriptors = HStoreField()

    class Meta:
        verbose_name = _("sample")
