# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
coll-gate accession module models.
"""

from django.db import models
from django.contrib.postgres.fields import HStoreField
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

    # JSON encoded values (mostly a dict or empty)
    values = models.TextField(default="", null=False)

    # JSON encoded format of the descriptor
    format = models.TextField(
        default='{"type": "string", "unit": "custom", "precision": "0.0", "fields": []}',
        null=False,
        blank=False)

    # Is this descriptor can be deleted by an authorised staff people
    can_delete = models.BooleanField(default=True)
    # Is this descriptor can be modified (rename, add/remove/modify its values)
    # by an authorised staff people
    can_modify = models.BooleanField(default=True)

    class Meta:
        verbose_name = _("descriptor type")


class DescriptorValue(Entity):
    """
    For some descriptors value are in a specific table.
    """

    descriptor = models.ForeignKey(DescriptorType, null=False, related_name='values_set')

    # Can be none, one or multiples parents values (ie: city in region in country...)
    # syntax could be "1,2" for two directs parent, and "1.2.3,4" with two parents and a hierarchy using dot
    parents = models.CharField(max_length=255, default="")

    # JSON encoded single value or object
    value = models.CharField(max_length=512, blank=False, null=False)

    class Meta:
        verbose_name = _("descriptor value")


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

    language = models.CharField(null=False, blank=False, max_length=2, choices=Languages.choices())
    type = models.IntegerField(null=False, blank=False, choices=AccessionSynonymType.choices())

    accession = models.ForeignKey('Accession', null=False, related_name='synonyms')

    class Meta:
        verbose_name = _("accession synonym")


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
