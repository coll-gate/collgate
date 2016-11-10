# -*- coding: utf-8; -*-
#
# Copyright (c) 2014 INRA UMR1095 GDEC

"""
coll-gate taxonomy module models.
"""
from django.db import models
from django.core.validators import validate_comma_separated_integer_list

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
    SECTION = IntegerChoice(72, _("Section"))
    SUB_SECTION = IntegerChoice(73, _("Sub-section"))
    SPECIE = IntegerChoice(80, _("Specie"))
    SUB_SPECIE = IntegerChoice(81, _("Sub-specie"))
    VARIETY = IntegerChoice(82, _("Variety"))


class Taxon(Entity):

    rank = models.IntegerField(choices=TaxonRank.choices())

    parent = models.ForeignKey('Taxon', null=True)
    parent_list = models.CharField(
        max_length=1024, blank=True, default="", validators=[validate_comma_separated_integer_list])

    class Meta:
        verbose_name = _("taxon")

    def audit_create(self, user):
        return {
            'rank': self.rank,
            'parent': self.parent_id,
            'parent_list': self.parent_list
        }

    def audit_update(self, user):
        if hasattr(self, 'updated_fields'):
            result = {'updated_fields': self.updated_fields}

            if 'rank' in self.updated_fields:
                result['rank'] = self.rank
            if 'parent' in self.updated_fields or 'parent_list' in self.updated_fields:
                result['parent'] = self.parent
                result['parent_list'] = self.parent_list
        else:
            return {
                'rank': self.rank,
                'parent': self.parent_id,
                'parent_list': self.parent_list
            }

    def audit_delete(self, user):
        return {}


class TaxonSynonym(Entity):

    language = models.CharField(max_length=2, choices=Languages.choices())
    type = models.IntegerField(choices=TaxonSynonymType.choices())

    taxon = models.ForeignKey(Taxon, related_name='synonyms')

    class Meta:
        verbose_name = _("taxon synonym")

    def audit_create(self, user):
        return {
            'language': self.language,
            'type': self.type,
            'taxon': self.taxon_id
        }

    def audit_update(self, user):
        if hasattr(self, 'updated_fields'):
            result = {'updated_fields': self.updated_fields}

            if 'language' in self.updated_fields:
                result['language'] = self.language
            if 'type' in self.updated_fields:
                result['type'] = self.type
        else:
            return {
                'language': self.language,
                'type': self.type
            }

    def audit_delete(self, user):
        return {}
