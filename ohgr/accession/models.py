# -*- coding: utf-8; -*-
#
# Copyright (c) 2014 INRA UMR1095 GDEC

"""
ohgr accession module models.
"""

from django.db import models

from igdectk.common.models import ChoiceEnum, IntegerChoice

from main.models import SynonymType, Languages


class AccessionSynonym(models.Model):

    name = models.CharField(unique=True, null=False, blank=False, max_length=255, db_index=True)
    language = models.CharField(null=False, blank=False, max_length=2, choices=Languages.choices())
    type = models.IntegerField(null=False, blank=False, choices=SynonymType.choices())

    accession = models.ForeignKey('Accession', null=False, related_name='synonyms')


class Asset(models.Model):

    name = models.CharField(unique=True, null=False, blank=False, max_length=255, db_index=True)
    accessions = models.ManyToManyField('Accession', related_name='assets')


class Accession(models.Model):

    name = models.CharField(unique=True, null=False, blank=False, max_length=255, db_index=True)


class Batch(models.Model):

    name = models.CharField(unique=True, null=False, blank=False, max_length=255, db_index=True)
    accession = models.ForeignKey('Accession', null=False, related_name='bundles')


class Sample(models.Model):

    name = models.CharField(unique=True, null=False, blank=False, max_length=255, db_index=True)
    batch = models.ForeignKey('Batch', null=False, related_name='samples')
