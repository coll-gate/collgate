# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
coll-gate accession module models.
"""
import json

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


class DescriptorValue(Entity):
    """
    For some descriptors value are in a specific table.
    """

    # A value is dedicated for a descriptor and an language
    language = models.CharField(
        null=False,
        blank=False,
        max_length=8,
        choices=Languages.choices(),
        default=Languages.EN.value)

    descriptor = models.ForeignKey(DescriptorType, null=False, related_name='values_set')

    # Can be none, one or multiples parents values (ie: city in region in country...)
    # syntax could be "1,2" for two directs parent, and "1.2.3,4" with two parents and a hierarchy using dot
    parents = models.CharField(max_length=255, default="")

    # JSON encoded single value or object
    value = models.CharField(max_length=512, blank=False, null=False)

    class Meta:
        verbose_name = _("descriptor value")

        unique_together = (
            ('language', 'descriptor'),
        )


class AccessionSynonymType(ChoiceEnum):
    """
    Static but may evolve into a DB editable descriptor type. general::accession_synonym.
    And must be a mandatory descriptor (created by fixtures during initialization).
    """

    PRIMARY = IntegerChoice(0, _('Primary'))
    SYNONYM = IntegerChoice(1, _('Synonym'))
    CODE = IntegerChoice(2, _('Code'))


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

    # TODO evolve in a CharField which takes its value from a specific descriptor added by fixtures
    # Fix this descriptor code as ID_001
    type = models.IntegerField(null=False, blank=False, choices=AccessionSynonymType.choices())

    class Meta:
        verbose_name = _("accession synonym")


class DescriptorModel(Entity):

    # TODO

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
