# -*- coding: utf-8; -*-
#
# Copyright (c) 2014 INRA UMR1095 GDEC

"""
ohgr taxonomy module models.
"""

from django.db import models

from django.utils.translation import ugettext_lazy as _
from igdectk.common.models import ChoiceEnum, IntegerChoice

from main.models import Languages, Entity


class TaxonSynonymType(ChoiceEnum):
    """
    Static but could evolve to DB in order to customize this types on a client.
    """

    PRIMARY = IntegerChoice(0, _('Primary'))
    SYNONYM = IntegerChoice(1, _('Synonym'))
    CODE = IntegerChoice(2, _('Code'))


class TaxonRank(ChoiceEnum):

    FAMILY = IntegerChoice(60, _("Family"))
    SUB_FAMILY = IntegerChoice(61, _("Sub-family"))
    GENUS = IntegerChoice(70, _("Genus"))
    SUB_GENUS = IntegerChoice(71, _("Sub-genus"))
    SPECIE = IntegerChoice(80, _("Specie"))
    SUB_SPECIE = IntegerChoice(81, _("Sub-specie"))


class Taxon(Entity):

    rank = models.IntegerField(null=False, blank=False, choices=TaxonRank.choices())

    parent = models.ForeignKey('Taxon', null=True)
    parent_list = models.CharField(max_length=1024, blank=True, default="")

    class Meta:
        verbose_name = _("taxon")


class TaxonSynonym(Entity):

    language = models.CharField(null=False, blank=False, max_length=2, choices=Languages.choices())
    type = models.IntegerField(null=False, blank=False, choices=TaxonSynonymType.choices())

    taxon = models.ForeignKey(Taxon, null=False, related_name='synonyms')

    def audit_create(self, user):
        return "Create TaxonSynonym %s for taxon(id=%s)" % (self.name, self.taxon.pk)

    def audit_delete(self, user):
        return "Delete TaxonSynonym %s for taxon(id=%s)" % (self.name, self.taxon.pk)

    class Meta:
        verbose_name = _("taxon synonym")
