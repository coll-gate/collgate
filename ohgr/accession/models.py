# -*- coding: utf-8; -*-
#
# Copyright (c) 2014 INRA UMR1095 GDEC

"""
ohgr accession module models.
"""

from django.db import models
from django.contrib.postgres.fields import HStoreField
from django.utils.translation import ugettext_lazy as _

from igdectk.common.models import ChoiceEnum, IntegerChoice

from main.models import Languages, Entity


class AccessionSynonymType(ChoiceEnum):
    """
    Static but could evolve to DB in order to customize this types on a client.
    """

    PRIMARY = IntegerChoice(0, _('Primary'))
    SYNONYM = IntegerChoice(1, _('Synonym'))
    CODE = IntegerChoice(2, _('Code'))


class AccessionSynonym(models.Model):

    language = models.CharField(null=False, blank=False, max_length=2, choices=Languages.choices())
    type = models.IntegerField(null=False, blank=False, choices=AccessionSynonymType.choices())

    accession = models.ForeignKey('Accession', null=False, related_name='synonyms')

    class Meta:
        verbose_name = _("accession synonym")


class Asset(Entity):

    accessions = models.ManyToManyField('Accession', related_name='assets')

    class Meta:
        verbose_name = _("panel")


class Accession(Entity):

    data = HStoreField()

    class Meta:
        verbose_name = _("accession")


class Batch(Entity):

    accession = models.ForeignKey('Accession', null=False, related_name='bundles')

    class Meta:
        verbose_name = _("batch")


class Sample(models.Model):

    name = models.CharField(unique=True, null=False, blank=False, max_length=255, db_index=True)
    batch = models.ForeignKey('Batch', null=False, related_name='samples')

    class Meta:
        verbose_name = _("sample")
