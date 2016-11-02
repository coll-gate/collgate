# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
coll-gate taxonomy module controller
"""
from django.core.exceptions import SuspiciousOperation, PermissionDenied

from main.models import Languages
from .models import Taxon, TaxonSynonym, TaxonSynonymType

from django.utils.translation import ugettext_lazy as _


class Taxonomy(object):

    @classmethod
    def update_parents(cls, taxon, parent=None):
        """
        Internaly defines the list of parent for a given taxon
        and parent (does not save the taxon).
        :param taxon: Valid Taxon instance.
        :param parent: None or valid Taxon instance.
        """
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
    def create_taxon(cls, name, rank, parent=None):
        """
        Create a new taxon with a unique name. The level must be
        greater than its parent level.
        :param name: Unique taxon name.
        :param rank: Taxon rank greater than parent rank.
        :param parent: None or valid Taxon instance.
        :return: None or new Taxon instance.
        """
        if Taxon.objects.filter(name=name).exists():
            return None

        if parent and rank <= parent.rank:
            return None

        taxon = Taxon()
        taxon.name = name
        taxon.rank = rank
        taxon.parent = parent
        taxon.parent_list = ""

        if parent:
            try:
                Taxonomy.update_parents(taxon, parent)
            except Taxon.DoesNotExist:
                return None

        taxon.save()

        # first name a primary synonym
        primary = TaxonSynonym(taxon_id=taxon.id, name=name, type=int(TaxonSynonymType.PRIMARY), language=Languages.FR.value)
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
            return Taxon.objects.filter(name=name)[0]
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
        return Taxon.objects.filter(name__contains=name_part)

    @classmethod
    def list_taxons_by_parent(cls, parent):
        """
        List all taxon having parent has direct parent.
        :param parent: Valid parent or None for root
        :return: Array of Taxon
        """
        return Taxon.objects.filter(parent=parent)

    @classmethod
    def list_taxons_having_parent(cls, parent):
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
            raise SuspiciousOperation('Empty synonym')

        if not synonym['name']:
            raise SuspiciousOperation(_('Undefined synonym name'))

        if not synonym['language']:
            raise SuspiciousOperation(_('Undefined synonym language'))

        if TaxonSynonym.objects.filter(taxon=taxon, type=TaxonSynonymType.PRIMARY.value, language=synonym['language']).exists():
            raise SuspiciousOperation(_('A primary name for the taxon with this language already exists'))

        if TaxonSynonym.objects.filter(name=synonym['name']).exists():
            raise PermissionDenied(_('Taxon synonym already exists'))

        synonym = TaxonSynonym(taxon=taxon,
                               name=synonym['name'],
                               type=synonym['type'],
                               language=synonym['language'])
        synonym.save()

    @classmethod
    def remove_synonym(cls, taxon, synonym):
        """
        Remove one synonyme from the given taxon.
        """
        if not synonym:
            return

        # cannot remove the primary synonym
        if not synonym['name'] or synonym['type'] == TaxonSynonymType.PRIMARY:
            return

        TaxonSynonym.objects.filter(taxon=taxon, name=synonym['name']).delete()
