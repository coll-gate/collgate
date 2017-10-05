# -*- coding: utf-8; -*-
#
# @file models.py
# @brief coll-gate classification module models.
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2016-09-01
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details

import re

from django.contrib.postgres.fields import JSONField, ArrayField
from django.db import models
from django.db.models import Q
from django.utils import translation

from django.utils.translation import ugettext_lazy as _

from classification import localsettings
from descriptor.models import DescriptorMetaModel
from igdectk.common.models import ChoiceEnum, IntegerChoice

from main.models import Entity, EntitySynonym


class BotanicalRank(ChoiceEnum):
    """
    Helper for standard botanical ranks.
    """

    FAMILY = IntegerChoice(0, _("Family"))
    SUB_FAMILY = IntegerChoice(1, _("Subfamily"))
    TRIBE = IntegerChoice(2, _("Tribe"))
    SUB_TRIBE = IntegerChoice(3, _("Subtribe"))
    GENUS = IntegerChoice(4, _("Genus"))
    SUB_GENUS = IntegerChoice(5, _("Subgenus"))
    SECTION = IntegerChoice(6, _("Section"))
    SUB_SECTION = IntegerChoice(7, _("Subsection"))
    SPECIE = IntegerChoice(8, _("Specie"))
    SUB_SPECIE = IntegerChoice(9, _("Subspecie"))
    VARIETY = IntegerChoice(10, _("Variety"))
    SUB_VARIETY = IntegerChoice(11, _("Subvariety"))
    CULTIVAR = IntegerChoice(12, _("Cultivar"))


class Classification(Entity):
    """
    Classification class that manage many ranks.
    """

    # default name validator
    NAME_VALIDATOR = {"type": "string", "minLength": 3, "maxLength": 128, "pattern": "^[a-zA-Z0-9\-\_]+$"}

    # default name validator optional
    NAME_VALIDATOR_OPTIONAL = {
        "type": "string", "minLength": 3, "maxLength": 128, "pattern": "^[a-zA-Z0-9\-\_]+$", "required": False}

    # management name
    name = models.CharField(unique=True, max_length=128, db_index=True)

    # Is this classification can be deleted when it is empty
    can_delete = models.BooleanField(default=True)

    # Is this classification can be modified (rename, add/remove ranks) by an authorized staff people
    can_modify = models.BooleanField(default=True)

    # Label of the classification.
    # It is i18nized used JSON dict with language code as key and label as string value.
    label = JSONField(default={})

    # general description
    description = models.TextField(default="", blank=True, null=False)

    class Meta:
        verbose_name = _("classification")

    def natural_name(self):
        return self.get_label()

    def get_label(self):
        """
        Get the label for this classification in the current regional.
        """
        lang = translation.get_language()
        return self.label.get(lang, "")

    def set_label(self, lang, label):
        """
        Set the label for a specific language.
        :param str lang: language code string
        :param str label: Localized label
        :note Model instance save() is not called.
        """
        self.label[lang] = label

    def audit_create(self, user):
        return {
            'name': self.name,
            'can_delete': self.can_delete,
            'can_modify': self.can_modify,
            'label': self.label,
            'description': self.description
        }

    def audit_update(self, user):
        if hasattr(self, 'updated_fields'):
            result = {'updated_fields': self.updated_fields}

            if 'name' in self.updated_fields:
                result['name'] = self.name

            if 'can_delete' in self.updated_fields:
                result['can_delete'] = self.can_delete

            if 'can_modify' in self.updated_fields:
                result['can_modify'] = self.can_modify

            if 'label' in self.updated_fields:
                result['label'] = self.label

            if 'description' in self.updated_fields:
                result['description'] = self.description

            return result
        else:
            return {
                'name': self.name,
                'can_delete': self.can_delete,
                'can_modify': self.can_modify,
                'label': self.label,
                'description': self.description
            }

    def audit_delete(self, user):
        return {
            'name': self.name
        }

    def in_usage(self):
        classification_ranks = self.ranks.all()
        return classification_ranks.exists()


class ClassificationRank(Entity):
    """
    Classification rank for a class.
    """

    # default name validator
    NAME_VALIDATOR = {"type": "string", "minLength": 3, "maxLength": 128, "pattern": "^[a-zA-Z0-9\-\_]+$"}

    # default name validator optional
    NAME_VALIDATOR_OPTIONAL = {
        "type": "string", "minLength": 3, "maxLength": 128, "pattern": "^[a-zA-Z0-9\-\_]+$", "required": False}

    # related classification
    classification = models.ForeignKey(Classification, null=False, related_name="ranks")

    # management name
    name = models.CharField(unique=True, max_length=128, db_index=True)

    # Label of the rank of classification.
    # It is i18nized used JSON dict with language code as key and label as string value.
    label = JSONField(default={})

    # rank level in ordinal (order is from lesser to greater | ancestor has lesser value than its successor)
    level = models.IntegerField()

    class Meta:
        verbose_name = _("classification rank")
        unique_together = (('classification', 'level'),)

    def natural_name(self):
        return self.get_label()

    def details(self):
        return {
            'name': self.name,
            'label': self.get_label(),
            'level': self.level
        }

    def get_label(self):
        """
        Get the label for this classification rank in the current regional.
        """
        lang = translation.get_language()
        return self.label.get(lang, "")

    def set_label(self, lang, label):
        """
        Set the label for a specific language.
        :param str lang: language code string
        :param str label: Localized label
        :note Model instance save() is not called.
        """
        self.label[lang] = label

    def audit_create(self, user):
        return {
            'name': self.name,
            'label': self.label,
            'level': self.level
        }

    def audit_update(self, user):
        if hasattr(self, 'updated_fields'):
            result = {'updated_fields': self.updated_fields}

            if 'name' in self.updated_fields:
                result['name'] = self.name

            if 'label' in self.updated_fields:
                result['label'] = self.label

            if 'level' in self.updated_fields:
                result['level'] = self.level

            return result
        else:
            return {
                'name': self.name,
                'label': self.label,
                'level': self.level
            }

    def audit_delete(self, user):
        return {
            'name': self.name
        }

    def in_usage(self):
        classificationentry_set = self.classificationentry_set.all()
        return classificationentry_set.exists()


class ClassificationEntry(Entity):
    """
    A record of classification, that refers to a specific rank of classification.
    """

    # usual name pattern with at least a length of 3
    NAME_RE = re.compile(r'^\S+.+\S+$', re.IGNORECASE)

    # default name validator
    NAME_VALIDATOR = {"type": "string", "minLength": 3, "maxLength": 128, "pattern": "^\S+.+\S+$"}

    # default name validator optional
    NAME_VALIDATOR_OPTIONAL = {
        "type": "string", "minLength": 3, "maxLength": 128, "pattern": "^\S+.+\S+$", "required": False}

    # unique primary name of the classification entry
    name = models.CharField(unique=True, max_length=128, db_index=True)

    # classification rank
    rank = models.ForeignKey(ClassificationRank, null=False, on_delete=models.PROTECT)

    # relate some others classifications entries of different nature of classification.
    related = models.ManyToManyField('ClassificationEntry', related_name='relate_to_classificationsentries')

    # classification direct parent or None
    parent = models.ForeignKey('ClassificationEntry', null=True, related_name="children", on_delete=models.PROTECT)

    # list of parents ordered from lower to direct one. Any cases can be contained into this string list
    parent_list = ArrayField(models.IntegerField())

    # JSONB field containing the list of descriptors model type id as key, with a descriptor value or value code.
    descriptors = JSONField(default={})

    # It refers to a set of models of type of descriptors through a meta-model of descriptor.
    # It can be null because it is possible to have the choice to defines or not some descriptors
    # to a classification entry.
    descriptor_meta_model = models.ForeignKey(DescriptorMetaModel, null=True)

    @classmethod
    def get_defaults_columns(cls):
        return {
            'name': {
                'label': _('Name'),
                'query': False,
                'format': {
                    'type': 'string',
                    'model': 'classification.classificationentry'
                },
                'available_operators': ['isnull', 'notnull', 'eq', 'neq', 'icontains']
            },
            'rank': {
                'label': _('Rank'),
                'field': 'level',  # @todo [rank.classification_id, rank.level] special sort
                'query': True,
                'format': {
                    'type': 'entity',
                    'model': 'classification.classificationrank',
                    'details': True,
                    'list_type': 'dropdown'
                }
            },
            'parent': {
                'label': _('Parent'),
                'field': 'name',
                'query': True,
                'format': {
                    'type': 'entity',
                    'model': 'classification.classificationentry',
                    'details': True
                }
            },
            'descriptor_meta_model': {
                'label': _('Model'),
                'field': 'name',
                'query': True,
                'format': {
                    'type': 'descriptor_meta_model',
                    'model': 'classification.classificationentry'
                },
                'available_operators': ['isnull', 'notnull', 'eq', 'neq', 'in', 'notin']
            },
            'synonym': {
                'label': _('Synonym'),
                'field': 'name',
                'query': False,   # done by a prefetch related
                'format': {
                    'type': 'synonym',
                    'model': 'classification.classificationsynonym'
                }
            }
        }

    class Meta:
        verbose_name = _("classification entry")

    def natural_name(self):
        return self.name

    def details(self):
        return {
            'name': self.name,
            'rank': self.rank_id,
            'parent': self.parent_id
        }

    @classmethod
    def make_search_by_name(cls, term):
        return Q(name__istartswith=term)

    def audit_create(self, user):
        return {
            'name': self.name,
            'rank': self.rank_id,
            'parent': self.parent_id,
            'parent_list': self.parent_list,
            'descriptor_meta_model': self.descriptor_meta_model_id,
            'descriptors': self.descriptors
        }

    def audit_update(self, user):
        if hasattr(self, 'updated_fields'):
            result = {'updated_fields': self.updated_fields}

            if 'name' in self.updated_fields:
                result['name'] = self.name

            if 'rank' in self.updated_fields:
                result['rank'] = self.rank_id

            if 'parent' in self.updated_fields or 'parent_list' in self.updated_fields:
                result['parent'] = self.parent_id
                result['parent_list'] = self.parent_list

            if 'descriptor_meta_model' in self.updated_fields:
                result['descriptor_meta_model'] = self.descriptor_meta_model_id

            if 'descriptors' in self.updated_fields:
                if hasattr(self, 'descriptors_diff'):
                    result['descriptors'] = self.descriptors_diff
                else:
                    result['descriptors'] = self.descriptors

            return result
        else:
            return {
                'name': self.name,
                'rank': self.rank_id,
                'parent': self.parent_id,
                'parent_list': self.parent_list,
                'descriptor_meta_model': self.descriptor_meta_model_id,
                'descriptors': self.descriptors
            }

    def audit_delete(self, user):
        return {
            'name': self.name
        }

    def in_usage(self):
        from django.apps import apps
        children_entities = apps.get_app_config('classification').children_entities

        for entity in children_entities:
            field_name = entity._meta.model_name + '_set'

            children = getattr(self, field_name)
            if children and children.all().exists():
                return True

        return False


class ClassificationEntrySynonym(EntitySynonym):
    """
    Synonym of classification entry.
    """

    # name validator, used with content validation, to avoid any whitespace before and after
    NAME_VALIDATOR = {"type": "string", "minLength": 1, "maxLength": 128, "pattern": "^\S+.+\S+$"}

    # code validator, used with content validation, to avoid any whitespace before and after
    CODE_VALIDATOR = {"type": "string", "minLength": 1, "maxLength": 128, "pattern": r"^\S+.+\S+$"}

    entity = models.ForeignKey(ClassificationEntry, related_name='synonyms')

    class Meta:
        verbose_name = _("classification entry synonym")

    def is_primary(self):
        """
        Is a primary name synonym.
        :return: True if primary
        """
        return self.synonym_type_id == localsettings.synonym_type_classification_entry_name
