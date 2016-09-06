# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
coll-gate accession module controller
"""

from main.models import Languages
from .models import Accession, AccessionSynonym, AccessionSynonymType


class Accession(object):

    @classmethod
    def create_accession(cls, name):
        """
        Create a new accession with a unique name.
        :param name: Unique accession name.
        :return: None or new Accession instance.
        """
        if Accession.objects.filter(name=name).exists():
            return None

        accession = Accession()
        accession.name = name

        accession.save()

        # first name a primary synonym
        primary = AccessionSynonym(accession_id=accession.id, name=name, type=int(AccessionSynonymType.PRIMARY), language=Languages.FR.value)
        primary.save()

        return accession

    @classmethod
    def get_accession_by_name(cls, name):
        """
        Return a unique accession by its name (unique).
        :param name: Valid accession name.
        :return: None or valid Accession instance.
        """
        try:
            return Accession.objects.filter(name=name)[0]
        except Accession.DoesNotExist:
            return None
        except Accession.MultipleObjectsReturned:
            return None

    @classmethod
    def search_accession_by_name(cls, name_part):
        """
        Return a list of accession containing name_part.
        :param name: Partial or complete accession name.
        :return: QuerySet of Accession
        """
        return Accession.objects.filter(name__contains=name_part)

    @classmethod
    def add_synonym(cls, accession_id, synonym):
        """
        Add one synonym to the given accession.
        """
        if not synonym:
            raise Exception('Empty synonym')

        if not synonym['name'] or synonym['type'] == AccessionSynonymType.PRIMARY:
            raise Exception('Undefined synonym name or primary synonym')

        if not synonym['language']:
            raise Exception('Undefined synonym langauge')

        synonym = AccessionSynonym(taxon_id=accession_id,
                                   name=synonym['name'],
                                   type=synonym['type'],
                                   language=synonym['language'])
        synonym.save()

    @classmethod
    def remove_synonym(cls, accession_id, synonym):
        """
        Remove one synonyme from the given accession.
        """
        if not synonym:
            return

        # cannot remove the primary synonym
        if not synonym['name'] or synonym['type'] == AccessionSynonymType.PRIMARY:
            return

        AccessionSynonym.objects.filter(accession_id=accession_id, name=synonym['name']).delete()
