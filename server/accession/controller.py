# -*- coding: utf-8; -*-
#
# @file controller.py
# @brief coll-gate accession module controller
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2016-09-01
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

from django.core.exceptions import SuspiciousOperation
from django.utils.translation import ugettext_lazy as _

from .models import Accession, AccessionSynonym


class AccessionController(object):

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
            raise SuspiciousOperation(_('Empty synonym data'))

        if not synonym['name'] or synonym['type'] == 'ID001:0000001':
            raise SuspiciousOperation(_('Undefined synonym name or primary synonym'))

        if not synonym['language']:
            raise SuspiciousOperation(_('Undefined synonym language'))

        synonym = AccessionSynonym(accession_id=accession_id,
                                   name=synonym['name'],
                                   type=synonym['type'],
                                   language=synonym['language'])
        synonym.save()

    @classmethod
    def remove_synonym(cls, accession_id, synonym):
        """
        Remove one synonym from the given accession.
        """
        if not synonym:
            return

        # cannot remove the primary synonym
        if not synonym['name'] or synonym['type'] == 'ID001:0000001':
            return

        AccessionSynonym.objects.filter(accession_id=accession_id, name=synonym['name']).delete()
