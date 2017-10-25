# -*- coding: utf-8; -*-
#
# @file controller.py
# @brief coll-gate classification module controller
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2016-09-01
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

from django.core.exceptions import SuspiciousOperation, PermissionDenied
from django.db import transaction

from classification import localsettings
from descriptor.describable import DescriptorsBuilder
from .models import ClassificationEntry, ClassificationRank
from .models import ClassificationEntrySynonym

from django.utils.translation import ugettext_lazy as _


class ClassificationEntryManager(object):

    @classmethod
    def update_parents(cls, classification_entry, parent=None):
        """
        Internally defines the list of parent for a given classification entry
        and parent (does not save the entry).
        :param classification_entry: Valid Classification entry instance.
        :param parent: None or valid Classification entry instance.
        """
        classification_entry.parent_list = []

        if not parent:
            return

        curr_parent = parent
        while curr_parent is not None:
            classification_entry.parent_list.append(curr_parent.id)

            if curr_parent.parent:
                curr_parent = curr_parent.parent
            else:
                break

    @classmethod
    @transaction.atomic
    def create_classification_entry(cls, name, rank_id, parent, language, descriptor_meta_model=None, descriptors=None):
        """
        Create a new classification entry with a unique name. The level must be
        greater than its parent level.
        :param name: Unique classification entry name.
        :param rank_id: Classification rank with a greater level than its parent rank.
        :param parent: None or valid Classification entry instance.
        :param language: Language code of the primary synonym created with name.
        :param descriptor_meta_model: Descriptor meta model instance or None.
        :param descriptors: Descriptors values or None if no descriptor meta model.
        :return: None or new Classification entry instance.
        """
        if ClassificationEntry.objects.filter(name=name).exists():
            raise SuspiciousOperation(_("A classification entry with this name already exists"))

        try:
            classification_rank = ClassificationRank.objects.get(id=rank_id)
        except ClassificationRank.DoesNotExist:
            raise SuspiciousOperation(_("The given classification rank does not exists"))

        if parent:
            if parent.rank.classification_id != classification_rank.classification_id:
                raise SuspiciousOperation(_("The parent and the children classification rank must be of the same nature"))

            if parent.rank.level >= classification_rank.level:
                raise SuspiciousOperation(_(
                    "The rank level of the parent must be lesser than the rank level of the new classification entry"))

        classification_entry = ClassificationEntry()
        classification_entry.name = name
        classification_entry.rank = classification_rank
        classification_entry.parent = parent
        classification_entry.parent_list = []
        classification_entry.descriptor_meta_model = descriptor_meta_model

        if parent:
            try:
                ClassificationEntryManager.update_parents(classification_entry, parent)
            except ClassificationEntry.DoesNotExist:
                return None

        # descriptors
        if descriptor_meta_model is not None:
            descriptors_builder = DescriptorsBuilder(classification_entry)

            descriptors_builder.check_and_update(descriptor_meta_model, descriptors)
            classification_entry.descriptors = descriptors_builder.descriptors

        classification_entry.save()

        # first name a primary synonym
        primary_synonym = ClassificationEntrySynonym(
            entity_id=classification_entry.id,
            name=name,
            synonym_type_id=localsettings.synonym_type_classification_entry_name,
            language=language
        )

        primary_synonym.save()

        return classification_entry

    @classmethod
    def get_classification_entry_by_name(cls, name):
        """
        Return a unique classification entry by its name (unique).
        :param name: Valid classification entry name.
        :return: None or valid Classification entry instance.
        """
        try:
            return ClassificationEntry.objects.get(name=name)
        except ClassificationEntry.DoesNotExist:
            return None
        except ClassificationEntry.MultipleObjectsReturned:
            return None

    @classmethod
    def search_classification_entry_by_name(cls, name_part):
        """
        Return a list of classification entry containing name_part.
        :param name: Partial or complete classification entry name.
        :return: QuerySet of Classification entry
        """
        return ClassificationEntry.objects.filter(name__icontains=name_part)

    @classmethod
    def list_classification_entry_by_parent(cls, parent):
        """
        List all classification entry having parent has direct parent.
        :param parent: Valid parent or None for root
        :return: Array of Classification entry
        """
        return ClassificationEntry.objects.filter(parent=parent)

    @classmethod
    def list_classification_entry_having_parent(cls, parent):
        """
        List all classification entry having parent as direct or indirect parent.
        :param parent: Valid parent, None for root, or an array of parent
        :return: Array of Classification entry
        """
        if isinstance(parent, ClassificationEntry):
            return ClassificationEntry.objects.filter(parent_list__in=[parent])
        elif isinstance(parent, list):
            return ClassificationEntry.objects.filter(parent_list__in=parent)

    @classmethod
    def add_synonym(cls, classification_entry, synonym):
        """
        Add one synonym to the given classification entry.
        """
        if not synonym:
            raise SuspiciousOperation(_('Empty synonym data'))

        if not synonym['name']:
            raise SuspiciousOperation(_('Undefined synonym name'))

        if not synonym['language']:
            raise SuspiciousOperation(_('Undefined synonym language'))

        # check that type is in the values of descriptor
        if not ClassificationEntrySynonym.is_synonym_type(synonym['type']):
            raise SuspiciousOperation(_("Unsupported type of synonym"))

        # check if a similar synonyms exists into the classification entry or as primary name
        # for another classificationEntry
        synonyms = ClassificationEntrySynonym.objects.filter(synonym__iexact=synonym['name'])

        for synonym in synonyms:
            # at least one usage, not compatible with primary synonym
            if synonym['type'] == 0:
                raise SuspiciousOperation(
                    _("The primary name could not be used by another synonym of classification entry"))

            # already used by another classificationEntry as primary name
            if synonym.is_primary():
                raise SuspiciousOperation(_("Synonym already used as a primary name"))

            # already used by this classificationEntry
            if synonym.classification_entry_id == classification_entry.id:
                raise SuspiciousOperation(_("Synonym already used into this classification entry"))

        synonym = ClassificationEntrySynonym(
            classification_entry=classification_entry,
            name="%s_%s" % (classification_entry.name, synonym['name']),
            synonym=synonym['name'],
            synonym_type=synonym['type'],
            language=synonym['language']
        )

        synonym.save()
