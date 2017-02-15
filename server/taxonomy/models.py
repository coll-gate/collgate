# -*- coding: utf-8; -*-
#
# Copyright (c) 2014 INRA UMR1095 GDEC

"""
coll-gate taxonomy module models.
"""
from django.contrib.postgres.fields import JSONField
from django.db import models
from django.core.validators import validate_comma_separated_integer_list

from django.utils.translation import ugettext_lazy as _

from descriptor.models import DescriptorMetaModel
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

    parent = models.ForeignKey('Taxon', null=True, related_name="children")

    # list of parents ordered from lower to direct one. Any cases can be contained into this string list
    parent_list = models.CharField(
        max_length=1024, blank=True, default="", validators=[validate_comma_separated_integer_list])

    # JSONB field containing the list of descriptors model type id as key, with a descriptor value or value code.
    descriptors = JSONField(default={})

    # It refers to a set of models of type of descriptors through a meta-model of descriptor.
    # It can be null because it is possible to have the choice to defines or not some descriptors
    # to a taxon.
    descriptor_meta_model = models.ForeignKey(DescriptorMetaModel, null=True)

    class Meta:
        verbose_name = _("taxon")

    def audit_create(self, user):
        return {
            'rank': self.rank,
            'parent': self.parent_id,
            'parent_list': self.parent_list,
            'descriptor_meta_model': self.descriptor_meta_model_id,
            'descriptors': self.descriptors
        }

    def audit_update(self, user):
        if hasattr(self, 'updated_fields'):
            result = {'updated_fields': self.updated_fields}

            if 'rank' in self.updated_fields:
                result['rank'] = self.rank

            if 'parent' in self.updated_fields or 'parent_list' in self.updated_fields:
                result['parent'] = self.parent_id
                result['parent_list'] = self.parent_list

            if 'descriptor_meta_model' in self.updated_fields:
                result['descriptor_meta_model'] = self.descriptor_meta_model_id

            if 'descriptors' in self.updated_fields:
                result['descriptors'] = self.descriptors

            return result
        else:
            return {
                'rank': self.rank,
                'parent': self.parent_id,
                'parent_list': self.parent_list,
                'descriptor_meta_model': self.descriptor_meta_model_id,
                'descriptors': self.descriptors
            }

    def audit_delete(self, user):
        return {}

    def in_usage(self):
        from django.apps import apps
        children_entities = apps.get_app_config('taxonomy').children_entities

        for entity in children_entities:
            field_name = entity._meta.model_name + '_set'

            children = getattr(self, field_name)
            if children and children.all().exists():
                return True

        return False


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
