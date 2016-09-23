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
                    next_code = str(cursor.split('/')[0]) if cursor else "ID_9999:99999999"

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

                # cursors
                if len(values_list) > 0:
                    val = values_list[0]
                    prev_cursor = "%s/%s" % (val['id'], val['id'])

                    val = values_list[-1]
                    next_cursor = "%s/%s" % (val['id'], val['id'])
            elif sort_by == 'ordinal':
                # sort by its ordinal value (a ordinal field in value) as integer compare
                # duplicated ordinals values are supported by string concatenation of ordinal+code during sorting
                next_ordinal = int(cursor.split('/')[0]) if cursor else -1

                if reverse:
                    for k, v in values.items():
                        if 'ordinal' not in v:
                            raise SuspiciousOperation("Missing ordinal field")

                        if v['ordinal'] < next_ordinal:
                            values_list.append({
                                'id': k,
                                'parent': v.get('parent', None),
                                'ordinal': v.get('ordinal', None),
                                'value0': v.get('value0', None),
                                'value1': v.get('value1', None),
                            })
                else:
                    for k, v in values.items():
                        if 'ordinal' not in v:
                            raise SuspiciousOperation("Missing ordinal field")

                        if v['ordinal'] > next_ordinal:
                            values_list.append({
                                'id': k,
                                'parent': v.get('parent', None),
                                'ordinal': v.get('ordinal', None),
                                'value0': v.get('value0', None),
                                'value1': v.get('value1', None),
                            })

                values_list = sorted(values_list, key=lambda v: v['ordinal']+v['id'], reverse=reverse)[:limit]

                # cursors
                if len(values_list) > 0:
                    val = values_list[0]
                    prev_cursor = "%s/%s" % (val['ordinal'], val['id'])

                    val = values_list[-1]
                    next_cursor = "%s/%s" % (val['ordinal'], val['id'])
            else:
                # sort by a field contained in the values as string compare
                # its not a trivial case because of blank values and duplications
                # blank values are supported, but there is not consistency if duplicated values
                # duplicated values are supported by string concatenation of value+code during sorting
                next_value, next_code = cursor.split('/') if cursor else (None, None)

                if next_code is None:
                    next_code = ""

                extra_list = []

                if reverse:
                    if cursor:
                        for k, v in values.items():
                            value = v.get(sort_by)

                            if value is None:
                                raise SuspiciousOperation("Invalid value field name")

                            if value is "" and k > next_code:
                                extra_list.append({
                                    'id': k,
                                    'parent': v.get('parent', None),
                                    'ordinal': v.get('ordinal', None),
                                    'value0': v.get('value0', None),
                                    'value1': v.get('value1', None),
                                })
                            elif next_value and value < next_value:
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

                            if value is None:
                                raise SuspiciousOperation("Invalid value field name")

                            if value is "":
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

                            if value is None:
                                raise SuspiciousOperation("Invalid value field name")

                            if value is "" and k > next_code:
                                extra_list.append({
                                    'id': k,
                                    'parent': v.get('parent', None),
                                    'ordinal': v.get('ordinal', None),
                                    'value0': v.get('value0', None),
                                    'value1': v.get('value1', None),
                                })
                            elif next_value and value > next_value:
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

                            if value is None:
                                raise SuspiciousOperation("Invalid value field name")

                            if value is "":
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

                values_list = sorted(values_list, key=lambda v: v[sort_by]+v['id'], reverse=reverse)[:limit]
                extra_size = limit - len(values_list)

                if extra_size > 0:
                    extra_list = sorted(extra_list, key=lambda v: v['id'])[:extra_size]
                    values_list += extra_list

                # cursors
                if len(values_list) > 0:
                    val = values_list[0]
                    prev_cursor = "%s/%s" % (val[sort_by], val['id'])

                    val = values_list[-1]
                    next_cursor = "%s/%s" % (val[sort_by], val['id'])
        else:  # per row value
            if trans:
                qs = self.values_set.filter(language=lang).prefetch_related('parent')
            else:
                qs = self.values_set.all().prefetch_related('parent')

            if sort_by == 'id':
                next_code = str(cursor.split('/')[0]) if cursor else None

                if reverse:
                    if next_code:
                        qs = qs.filter(name__lt=next_code).order_by('-name')
                    else:
                        qs = qs.order_by('-name')
                else:
                    if next_code:
                        qs = qs.filter(name__gt=next_code).order_by('name')
                    else:
                        qs = qs.order_by('name')
            elif sort_by == 'ordinal':
                next_ordinal = int(cursor.split('/')[0]) if cursor else None

                if reverse:
                    if next_ordinal:
                        qs = qs.filter(ordinal__lt=next_ordinal).order_by('-ordinal')
                    else:
                        qs = qs.order_by('-ordinal')
                else:
                    if next_ordinal:
                        qs = qs.filter(ordinal__gt=next_ordinal).order_by('ordinal')
                    else:
                        qs = qs.order_by('ordinal')
            elif sort_by == 'value0':
                next_value0 = str(cursor.split('/')[0]) if cursor else None

                if reverse:
                    if next_value0:
                        qs = qs.filter(value0__lt=next_value0).order_by('-value0')
                    else:
                        qs = qs.order_by('-value0')
                else:
                    if next_value0:
                        qs = qs.filter(value0__gt=next_value0).order_by('value0')
                    else:
                        qs = qs.order_by('value0')
            elif sort_by == 'value1':
                next_value1 = str(cursor.split('/')[0]) if cursor else None

                if reverse:
                    if next_value1:
                        qs = qs.filter(value1__lt=next_value1).order_by('-value1')
                    else:
                        qs = qs.order_by('-value1')
                else:
                    if next_value1:
                        qs = qs.filter(value1__gt=next_value1).order_by('value1')
                    else:
                        qs = qs.order_by('value1')

            qs = qs[:limit]

            for value in qs:
                values_list.append({
                    'id': value.name,
                    'parent': value.parent,
                    'ordinal': value.ordinal,
                    'value0': value.value0,
                    'value1': value.value1
                })

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

    # Related type of descriptor.
    descriptor = models.ForeignKey(DescriptorType, null=False, related_name='values_set')

    # Direct parent descriptor value, in case of one level hierarchy.
    parent = models.ForeignKey('DescriptorValue', null=True, related_name='children_set')

    # Ordinal with numeric value index for ordinal_with_text type of format.
    ordinal = models.IntegerField(default=0, null=False, blank=False)

    # Single enumeration field, or pair enumeration first field
    value0 = models.CharField(max_length=127, default="", blank=True, null=False)

    # Pair enumeration second field
    value1 = models.CharField(max_length=127, default="", blank=True, null=False)

    class Meta:
        verbose_name = _("descriptor value")

        unique_together = (
            ('descriptor', 'language'),
        )

        index_together = (
            ('descriptor', 'language', 'ordinal'),   # index for ordinals
            ('descriptor', 'language', 'value0'),  # index for value0
            ('descriptor', 'language', 'value1'),  # index for value1
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

    # Type of synonym is related to the type of descriptor ID_001 that is an 'enum_single'.
    type = models.CharField(max_length=16, null=False, blank=False, default='ID_001:0000001')

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

    # Related panel of descriptors
    panel = models.ForeignKey(DescriptorPanel, null=False, blank=False)

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
    description = models.TextField(null=False, default="")

    class Meta:
        verbose_name = _("descriptor model")


class Asset(Entity):
    """
    Defines a collection of accessions, with particular permissions on it.
    """

    accessions = models.ManyToManyField('Accession', related_name='assets')

    class Meta:
        verbose_name = _("panel")


class Accession(Entity):
    """
    Accession entity.
    """

    descriptors = HStoreField()

    # Can have many synonyms, and some synonyms can sometimes be shared by multiples accessions.
    synonyms = models.ManyToManyField(AccessionSynonym, related_name='accessions')

    # Model of accession refers to a model of type of descriptors related to a specific accession
    descriptor_model = models.ForeignKey(DescriptorModel, related_name='accessions')

    class Meta:
        verbose_name = _("accession")


class Batch(Entity):
    """
    Lot for an accession.
    """

    accession = models.ForeignKey('Accession', null=False, related_name='bundles')

    descriptors = HStoreField()

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
