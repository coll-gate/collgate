# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
coll-gate accession module models.
"""

from django.utils.translation import ugettext_lazy as _
from django.db import models

from main.models import Languages, Entity
from descriptor.models import DescribableEntity


class AccessionSynonym(Entity):
    """
    Table specific to accession to defines the synonyms.
    """

    language = models.CharField(max_length=8, choices=Languages.choices(), default=Languages.EN.value)

    # Type of synonym is related to the type of descriptor IN_001 that is an 'enum_single'.
    type = models.CharField(max_length=64, default='IN_001:0000001')

    class Meta:
        verbose_name = _("accession synonym")


class Asset(Entity):
    """
    Defines a collection of accessions, with particular permissions on it.
    """

    accessions = models.ManyToManyField('Accession', related_name='assets')

    class Meta:
        verbose_name = _("panel")


class Accession(DescribableEntity):
    """
    Accession entity defines a physical or virtual accession.
    """

    # Can have many synonyms, and some synonyms can sometimes be shared by multiples accessions.
    synonyms = models.ManyToManyField(AccessionSynonym, related_name='accessions')

    class Meta:
        verbose_name = _("accession")

    def audit_create(self, user):
        return {
            'descriptors': self.descriptors
        }

    def audit_update(self, user):
        return {
            'descriptors': self.descriptors
        }

    def audit_delete(self, user):
        return {}


class Batch(DescribableEntity):
    """
    Lot for an accession.
    """

    accession = models.ForeignKey('Accession', related_name='bundles')

    class Meta:
        verbose_name = _("batch")

    def audit_create(self, user):
        return {
            'descriptors': self.descriptors
        }

    def audit_update(self, user):
        return {
            'descriptors': self.descriptors
        }

    def audit_delete(self, user):
        return {}


class Sample(DescribableEntity):
    """
    Sample during lot processing.
    """

    name = models.CharField(unique=True, max_length=255, db_index=True)
    batch = models.ForeignKey('Batch', related_name='samples')

    class Meta:
        verbose_name = _("sample")

    def audit_create(self, user):
        return {
            'descriptors': self.descriptors
        }

    def audit_update(self, user):
        return {
            'descriptors': self.descriptors
        }

    def audit_delete(self, user):
        return {}
