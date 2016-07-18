# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
ohgr accession module models.
"""

from django.db import models
from django.contrib.postgres.fields import HStoreField
from django.utils.translation import ugettext_lazy as _

from igdectk.common.models import ChoiceEnum, IntegerChoice

from main.models import Languages, Entity


class DescriptorGroup(models.Model):
    """
    Category of a type of descriptor for an accession.
    """

    name = models.CharField(unique=True, max_length=255, null=False, blank=False)


class DescriptorType(models.Model):
    """
    Type of descriptor for an accession.
    Mostly related to a Crop Ontology code.
    """

    name = models.CharField(unique=True, max_length=255, null=False, blank=False)
    # code can be a Crop Ontology (CO_XYZ:NNNNNN) code (see http://www.cropontology.org/ontology)
    # and http://www.cropontology.org/get-ontology/CO_[0-9]+ to get a JSON version.
    code = models.CharField(unique=True, max_length=64, null=False, blank=False)

    # default should belong to the general group.
    group = models.ForeignKey(DescriptorGroup, null=False)

    # informative description.
    description = models.TextField()

    # JSON encoded values (mostly a dict) and generally extracted from crop-ontology minus some useless details.
    values = models.TextField(default="", null=False)


class AccessionSynonymType(ChoiceEnum):
    """
    Static but may evolve into a DB model in order to be more dynamic and as a
    specialized type of descriptor.
    """

    PRIMARY = IntegerChoice(0, _('Primary'))
    SYNONYM = IntegerChoice(1, _('Synonym'))
    CODE = IntegerChoice(2, _('Code'))


class AccessionSynonym(models.Model):
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
