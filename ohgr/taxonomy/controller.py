# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
ohgr taxonomy module main
"""
from .models import Taxon


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
            taxon.parent_list.append(curr_parent)

            if curr_parent.parent:
                curr_parent = curr_parent.parent
            else:
                break

    @classmethod
    def create_taxon(cls, name, level, parent=None):
        """
        Create a new taxon with a unique name. The level must be
        greater than its parent level.
        :param name: Unique taxon name.
        :param level: Taxon level greater than parent level.
        :param parent: None or valid Taxon instance.
        :return: None or new Taxon instance.
        """
        if Taxon.objects.filter(name=name).count() > 0:
            return None

        if parent and level <= parent.level:
            return None

        taxon = Taxon()
        taxon.name = name
        taxon.level = level
        taxon.parent = parent
        taxon.parent_list = []

        if parent:
            try:
                Taxonomy.update_parents(taxon, parent)
            except Taxon.DoesNotExist:
                return None

        taxon.save()

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
