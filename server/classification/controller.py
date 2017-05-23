# -*- coding: utf-8; -*-
#
# @file controller.py
# @brief 
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2016-09-01
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

"""
coll-gate classification module controller
"""

from django.core.exceptions import SuspiciousOperation, PermissionDenied
from django.db import transaction
from django.utils import translation

from descriptor.describable import DescriptorsBuilder
from main.models import Languages
from .models import Taxon, TaxonSynonym, TaxonSynonymType, TaxonRank

from django.utils.translation import ugettext_lazy as _


class Taxonomy(object):

    @classmethod
    def update_parents(cls, taxon, parent=None):
        """
        Internally defines the list of parent for a given taxon
        and parent (does not save the taxon).
        :param taxon: Valid Taxon instance.
        :param parent: None or valid Taxon instance.
        """
        taxon.parent_list = ""

        if not parent:
            return

        curr_parent = parent
        while curr_parent is not None:
            taxon.parent_list += str(curr_parent.id) + ','

            if curr_parent.parent:
                curr_parent = curr_parent.parent
            else:
                break

    @classmethod
    @transaction.atomic
    def create_taxon(cls, name, rank_id, parent, language, descriptor_meta_model=None, descriptors=None):
        """
        Create a new taxon with a unique name. The level must be
        greater than its parent level.
        :param name: Unique taxon name.
        :param rank_id: Taxon rank greater than parent rank.
        :param parent: None or valid Taxon instance.
        :param language: Language code of the primary synonym created with name.
        :param descriptor_meta_model: Descriptor meta model instance or None.
        :param descriptors: Descriptors values or None if no descriptor meta model.
        :return: None or new Taxon instance.
        """
        if Taxon.objects.filter(name=name).exists():
            raise SuspiciousOperation(_("A taxon with this name already exists"))

        rank = TaxonRank(rank_id)

        if parent and rank.value <= parent.rank:
            raise SuspiciousOperation(_("The rank of the parent must be lesser than the new taxon"))

        taxon = Taxon()
        taxon.name = name
        taxon.rank = rank_id
        taxon.parent = parent
        taxon.parent_list = ""
        taxon.descriptor_meta_model = descriptor_meta_model

        if parent:
            try:
                Taxonomy.update_parents(taxon, parent)
            except Taxon.DoesNotExist:
                return None

        # descriptors
        if descriptor_meta_model is not None:
            descriptors_builder = DescriptorsBuilder(taxon)

            descriptors_builder.check_and_update(descriptor_meta_model, descriptors)
            taxon.descriptors = descriptors_builder.descriptors

        taxon.save()

        # first name a primary synonym
        primary = TaxonSynonym(
            taxon_id=taxon.id,
            name=name,
            type=TaxonSynonymType.PRIMARY.value,
            language=language)

        primary.save()

        return taxon

    @classmethod
    def get_taxon_by_name(cls, name):
        """
        Return a unique taxon by its name (unique).
        :param name: Valid taxon name.
        :return: None or valid Taxon instance.
        """
        try:
            return Taxon.objects.get(name=name)
        except Taxon.DoesNotExist:
            return None
        except Taxon.MultipleObjectsReturned:
            return None

    @classmethod
    def search_taxon_by_name(cls, name_part):
        """
        Return a list of taxon containing name_part.
        :param name: Partial or complete taxon name.
        :return: QuerySet of Taxon
        """
        return Taxon.objects.filter(name__icontains=name_part)

    @classmethod
    def list_taxon_by_parent(cls, parent):
        """
        List all taxon having parent has direct parent.
        :param parent: Valid parent or None for root
        :return: Array of Taxon
        """
        return Taxon.objects.filter(parent=parent)

    @classmethod
    def list_taxon_having_parent(cls, parent):
        """
        List all taxon having parent as direct or indirect parent.
        :param parent: Valid parent, None for root, or an array of parent
        :return: Array of Taxon
        """
        if isinstance(parent, Taxon):
            return Taxon.objects.filter(parent_list__in=[parent])
        elif isinstance(parent, list):
            return Taxon.objects.filter(parent_list__in=parent)

    @classmethod
    def add_synonym(cls, taxon, synonym):
        """
        Add one synonym to the given taxon.
        """
        if not synonym:
            raise SuspiciousOperation(_('Empty synonym data'))

        if not synonym['name']:
            raise SuspiciousOperation(_('Undefined synonym name'))

        if not synonym['language']:
            raise SuspiciousOperation(_('Undefined synonym language'))

        # check that type is in the values of descriptor
        if not TaxonSynonym.is_synonym_type(synonym['type']):
            raise SuspiciousOperation(_("Unsupported type of synonym"))

        # check if a similar synonyms exists into the taxon or as primary name for another taxon
        synonyms = TaxonSynonym.objects.filter(synonym__iexact=synonym['name'])

        for synonym in synonyms:
            # at least one usage, not compatible with primary synonym
            if synonym['type'] == TaxonSynonymType.PRIMARY.value:
                raise SuspiciousOperation(_("The primary name could not be used by another synonym of taxon"))

            # already used by another taxon as primary name
            if synonym.is_primary():
                raise SuspiciousOperation(_("Synonym already used as a primary name"))

            # already used by this taxon
            if synonym.taxon_id == taxon.id:
                raise SuspiciousOperation(_("Synonym already used into this taxon"))

        synonym = TaxonSynonym(taxon=taxon,
                               name="%s_%s" % (taxon.name, synonym['name']),
                               synonym=synonym['name'],
                               type=synonym['type'],
                               language=synonym['language'])
        synonym.save()

