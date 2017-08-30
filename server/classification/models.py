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
from django.core.validators import validate_comma_separated_integer_list
from django.db.models import Q
from django.utils import translation

from django.utils.translation import ugettext_lazy as _

from descriptor.models import DescriptorMetaModel
from igdectk.common.models import ChoiceEnum, IntegerChoice

from main.models import Entity


class TaxonSynonymType(ChoiceEnum):
    """
    Static but could evolve to DB in order to customize this types on a client.
    """

    PRIMARY = IntegerChoice(0, _('Primary'))
    SYNONYM = IntegerChoice(1, _('Synonym'))
    CODE = IntegerChoice(2, _('Code'))


class TaxonRank(ChoiceEnum):

    FAMILY = IntegerChoice(60, _("Family"))
    SUB_FAMILY = IntegerChoice(61, _("Subfamily"))
    TRIBE = IntegerChoice(65, _("Tribe"))
    SUB_TRIBE = IntegerChoice(66, _("Subtribe"))
    GENUS = IntegerChoice(70, _("Genus"))
    SUB_GENUS = IntegerChoice(71, _("Subgenus"))
    SECTION = IntegerChoice(72, _("Section"))
    SUB_SECTION = IntegerChoice(73, _("Subsection"))
    SPECIE = IntegerChoice(80, _("Specie"))
    SUB_SPECIE = IntegerChoice(81, _("Subspecie"))
    VARIETY = IntegerChoice(82, _("Variety"))
    SUB_VARIETY = IntegerChoice(83, _("Subvariety"))
    CULTIVAR = IntegerChoice(90, _("Cultivar"))


class Taxon(Entity):

    # default name validator
    NAME_VALIDATOR = {"type": "string", "minLength": 3, "maxLength": 128, "pattern": "^[a-zA-Z0-9\-\_]+$"}

    # default name validator optional
    NAME_VALIDATOR_OPTIONAL = {
        "type": "string", "minLength": 3, "maxLength": 128, "pattern": "^[a-zA-Z0-9\-\_]+$", "required": False}

    # rank validator
    RANK_VALIDATOR = {"type": "number", 'minimum': 0, 'maximum': 100}

    # unique name of taxon
    name = models.CharField(unique=True, max_length=255, db_index=True)

    # taxon rank
    rank = models.IntegerField(choices=TaxonRank.choices())

    # taxon direct parent or None
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

    @classmethod
    def get_defaults_columns(cls):
        return {
            'rank': {  # @todo defined by classification later, dynamically
                'label': _('Rank'),
                # 'field': 'name',
                'query': False,
                'format': {
                    'type': 'classification_rank',  # @todo create this type or use enum_ordinal
                    'model': 'classification.rank'
                }
            },
            'parent': {  # @todo to be replaced by a multiple classification
                'label': _('Classification'),
                'field': 'name',
                'query': False,   # could be later, for the moment LEFT JOIN into the queryset
                'format': {
                    'type': 'entity',
                    'model': 'classification.taxon'
                }
            },
            'descriptor_meta_model': {
                'label': _('Model'),
                'field': 'name',
                'query': True,
                'format': {
                    'type': 'descriptor_meta_model',
                    'model': 'classification.taxon'
                }
            },
            'synonym': {  # @todo how to manage cursor on a M2M ??
                'label': _('Synonym'),
                'field': 'name',
                'query': False,   # done by a prefetch related
                'format': {
                    'type': 'synonym',
                    'model': 'taxon.synonym'
                }
            }
        }

    class Meta:
        verbose_name = _("taxon")

    def natural_name(self):
        return self.name

    @classmethod
    def make_search_by_name(cls, term):
        return Q(name__istartswith=term)

    def audit_create(self, user):
        return {
            'name': self.name,
            'rank': self.rank,
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
                result['rank'] = self.rank

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
                'rank': self.rank,
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


class TaxonSynonym(Entity):

    # name validator, used with content validation, to avoid any whitespace before and after
    NAME_VALIDATOR = {"type": "string", "minLength": 3, "maxLength": 128, "pattern": r"^\S+.+\S+$"}

    # related taxon
    taxon = models.ForeignKey(Taxon, related_name="synonyms")

    # display name of the synonym
    name = models.CharField(max_length=255, db_index=True)

    # language code
    language = models.CharField(max_length=5, default="en")

    # type of synonym is related to TaxonSynonymType values
    type = models.IntegerField(choices=TaxonSynonymType.choices())

    class Meta:
        verbose_name = _("taxon synonym")

    def natural_name(self):
        return self.name

    @classmethod
    def make_search_by_name(cls, term):
        return Q(name__istartswith=term)

    def audit_create(self, user):
        return {
            'name': self.name,
            'language': self.language,
            'type': self.type,
            'taxon': self.taxon_id
        }

    def audit_update(self, user):
        if hasattr(self, 'updated_fields'):
            result = {'updated_fields': self.updated_fields}

            if 'name' in self.updated_fields:
                result['name'] = self.name

            if 'language' in self.updated_fields:
                result['language'] = self.language

            if 'type' in self.updated_fields:
                result['type'] = self.type
        else:
            return {
                'name': self.name,
                'language': self.language,
                'type': self.type
            }

    def audit_delete(self, user):
        return {
            'name': self.name
        }

    def is_primary(self):
        """
        Is a primary type of synonym.
        :return: True if primary
        """
        return self.type == TaxonSynonymType.PRIMARY.value

    @classmethod
    def is_synonym_type(cls, synonym_type):
        try:
            TaxonSynonymType(synonym_type)
        except ValueError:
            return False

        return True


class ClassificationEntrySynonymType(ChoiceEnum):
    """
    Statically defined type of synonyms for classification entry.
    """

    PRIMARY = IntegerChoice(0, _('Primary'))
    SYNONYM = IntegerChoice(1, _('Synonym'))
    CODE = IntegerChoice(2, _('Code'))


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

    # Label of the classification.
    # It is i18nized used JSON dict with language code as key and label as string value.
    label = JSONField(default={})

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

    def natural_name(self):
        return self.get_label()

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

    # bridge/link to another classification.
    # bridge = models.ForeignKey(ClassificationRank, null=False, on_delete=models.PROTECT)

    # classification direct parent or None
    parent = models.ForeignKey('ClassificationEntry', null=True, related_name="children", on_delete=models.PROTECT)

    # list of parents ordered from lower to direct one. Any cases can be contained into this string list
    parent_list = ArrayField(models.IntegerField())

    # JSONB field containing the list of descriptors model type id as key, with a descriptor value or value code.
    descriptors = JSONField(default={})

    # It refers to a set of models of type of descriptors through a meta-model of descriptor.
    # It can be null because it is possible to have the choice to defines or not some descriptors
    # to a taxon.
    descriptor_meta_model = models.ForeignKey(DescriptorMetaModel, null=True)

    @classmethod
    def get_defaults_columns(cls):
        return {
            'rank': {  # @todo defined by classification later, dynamically
                'label': _('Rank'),
                # 'field': 'name',  # label[:lang_code:]
                'query': False,
                'format': {
                    'type': 'classification_rank',  # @todo create this type/widget
                    'model': 'classification.rank'
                }
            },
            'parent': {
                'label': _('Classification'),
                'field': 'name',
                'query': False,   # could be later, for the moment LEFT JOIN into the queryset
                'format': {
                    'type': 'entity',
                    'model': 'classification.classificationentry'
                }
            },
            'descriptor_meta_model': {
                'label': _('Model'),
                'field': 'name',
                'query': True,
                'format': {
                    'type': 'descriptor_meta_model',
                    'model': 'classification.taxon'
                }
            },
            'synonym': {  # cannot be managed for table or only a preferred one
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
        verbose_name = _("classifiction entry")

    def natural_name(self):
        return self.name

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


class ClassificationEntrySynonym(Entity):

    # name validator, used with content validation, to avoid any whitespace before and after
    NAME_VALIDATOR = {"type": "string", "minLength": 3, "maxLength": 128, "pattern": r"^\S+.+\S+$"}

    # related classification entry
    classification_entry = models.ForeignKey(ClassificationEntry, related_name="synonyms", on_delete=models.CASCADE)

    # display name of the synonym
    name = models.CharField(max_length=128, db_index=True)

    # language code
    language = models.CharField(max_length=5, default="en")

    # type of synonym is related to ClassificationEntrySynonymType values
    type = models.IntegerField(choices=ClassificationEntrySynonymType.choices())

    class Meta:
        verbose_name = _("classification entry synonym")

    def natural_name(self):
        return self.name

    @classmethod
    def make_search_by_name(cls, term):
        return Q(name__istartswith=term)

    def audit_create(self, user):
        return {
            'name': self.name,
            'language': self.language,
            'type': self.type,
            'classification_entry': self.classification_entry_id
        }

    def audit_update(self, user):
        if hasattr(self, 'updated_fields'):
            result = {'updated_fields': self.updated_fields}

            if 'name' in self.updated_fields:
                result['name'] = self.name

            if 'language' in self.updated_fields:
                result['language'] = self.language

            if 'type' in self.updated_fields:
                result['type'] = self.type
        else:
            return {
                'name': self.name,
                'language': self.language,
                'type': self.type
            }

    def audit_delete(self, user):
        return {
            'name': self.name
        }

    def is_primary(self):
        """
        Is a primary type of synonym.
        :return: True if primary
        """
        return self.type == ClassificationEntrySynonymType.PRIMARY.value

    @classmethod
    def is_synonym_type(cls, synonym_type):
        try:
            ClassificationEntrySynonymType(synonym_type)
        except ValueError:
            return False

        return True
