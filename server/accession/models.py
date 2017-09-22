# -*- coding: utf-8; -*-
#
# @file models.py
# @brief coll-gate accession module models.
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2016-09-01
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details

import re

from django.contrib.auth.models import User
from django.contrib.postgres.fields import JSONField
from django.db import models
from django.db.models import Q
from django.utils.translation import ugettext_lazy as _

from accession import localsettings
from classification.models import ClassificationEntry
from descriptor.models import DescribableEntity
from descriptor.models import DescriptorMetaModel
from igdectk.common.models import ChoiceEnum, IntegerChoice
from main.models import Entity, EntitySynonym


class AccessionClassificationEntry(models.Model):
    """
    M2M accession to classification entry with additional flags.
    """

    # accession object
    accession = models.ForeignKey('Accession', on_delete=models.CASCADE)

    # classification entry object
    classification_entry = models.ForeignKey(ClassificationEntry, on_delete=models.CASCADE)

    # is a primary or secondary classification association
    primary = models.BooleanField(default=False, db_index=True)

    def natural_name(self):
        return self.accession.name

    class Meta:
        index_together = (
            ('accession', 'classification_entry'),
            ('accession', 'primary')
        )


class Accession(DescribableEntity):
    """
    Accession entity defines a physical or virtual accession.
    """

    # simple name pattern with alphanumeric characters plus _ and - with a least a length of 1
    NAME_RE = re.compile(r'^[a-zA-Z0-9_-]+$', re.IGNORECASE)

    # default name validator
    NAME_VALIDATOR = {"type": "string", "minLength": 1, "maxLength": 182, "pattern": "^[a-zA-Z0-9\-\_]+$"}

    # non-unique primary name of the accession
    name = models.CharField(max_length=255, db_index=True)

    # unique GRC code of the accession
    code = models.CharField(unique=True, max_length=255, db_index=True)

    # primary classification as simple FK for a simple join
    primary_classification_entry = models.ForeignKey(
        ClassificationEntry, on_delete=models.PROTECT, related_name='primary_accessions', null=True)

    # accession can have many classification but at least a primary
    classifications_entries = models.ManyToManyField(
        through=AccessionClassificationEntry, to=ClassificationEntry, related_name='accession_set')

    @classmethod
    def get_defaults_columns(cls):
        return {
            'primary_classification_entry': {
                'label': _('Classification'),
                'field': 'name',
                'query': True,  # False,   # could be later, for the moment LEFT JOIN into the queryset
                'format': {
                    'type': 'entity',
                    'model': 'classification.classificationentry',
                    'details': True
                },
                'available_operators': ['isnull', 'notnull', 'eq', 'neq', 'in', 'notin']
            },
            'descriptor_meta_model': {
                'label': _('Model'),
                'field': 'name',
                'query': True,
                'format': {
                    'type': 'descriptor_meta_model',
                    'model': 'accession.accession'
                },
                'available_operators': ['isnull', 'notnull', 'eq', 'neq', 'in', 'notin']
            },
            'synonym': {
                'label': _('Synonym'),
                'field': 'name',
                'query': False,  # done by a prefetch related
                'format': {
                    'type': 'string',
                    'model': 'accession.accessionsynonym'
                },
                'available_operators': ['isnull', 'notnull', 'eq', 'neq', 'icontains']
            },
            'name': {
                'label': _('Name'),
                'query': False,  # done by a prefetch related
                'format': {
                    'type': 'string',
                    'model': 'accession.accession'
                },
                'available_operators': ['isnull', 'notnull', 'eq', 'neq', 'icontains']
            },
            'code': {
                'label': _('Code'),
                'query': False,  # done by a prefetch related
                'format': {
                    'type': 'string',
                    'model': 'accession.accession'
                },
                'available_operators': ['isnull', 'notnull', 'eq', 'neq', 'icontains']
            }
        }

    class Meta:
        verbose_name = _("accession")

        permissions = (
            ("get_accession", "Can get an accession"),
            ("list_accession", "Can list accessions"),
            ("search_accession", "Can search for accessions")
        )

    def natural_name(self):
        return self.name

    @classmethod
    def make_search_by_name(cls, term):
        return Q(name__istartswith=term)

    def audit_create(self, user):
        return {
            'name': self.name,
            'code': self.code,
            'primary_classification_entry': self.primary_classification_entry_id,
            'descriptor_meta_model': self.descriptor_meta_model_id,
            'descriptors': self.descriptors
        }

    def audit_update(self, user):
        if hasattr(self, 'updated_fields'):
            result = {'updated_fields': self.updated_fields}

            if 'code' in self.updated_fields:
                result['code'] = self.code

            if 'name' in self.updated_fields:
                result['name'] = self.name

            if 'primary_classification_entry' in self.updated_fields:
                result['primary_classification_entry'] = self.primary_classification_entry_id

            if 'descriptors' in self.updated_fields:
                if hasattr(self, 'descriptors_diff'):
                    result['descriptors'] = self.descriptors_diff
                else:
                    result['descriptors'] = self.descriptors

            return result
        else:
            return {
                'name': self.name,
                'code': self.code,
                'primary_classification_entry': self.primary_classification_entry_id,
                'descriptors': self.descriptors
            }

    def audit_delete(self, user):
        return {
            'name': self.name
        }


class AccessionSynonym(EntitySynonym):
    """
    Synonym of accession model.
    """

    # name validator, used with content validation, to avoid any whitespace before and after
    NAME_VALIDATOR = {"type": "string", "minLength": 1, "maxLength": 128, "pattern": "^[a-zA-Z0-9\-\_]+$"}

    # code validator, used with content validation, to avoid any whitespace before and after
    CODE_VALIDATOR = {"type": "string", "minLength": 1, "maxLength": 128, "pattern": r"^\S+.+\S+$"}

    entity = models.ForeignKey(Accession, related_name='synonyms')

    class Meta:
        verbose_name = _("accession synonym")

    def is_primary(self):
        """
        Is a primary name synonym.
        :return: True if primary
        """
        return self.synonym_type_id == localsettings.synonym_type_accession_name

    def is_code(self):
        """
        Is a code synonym.
        :return: True if primary
        """
        return self.synonym_type_id == localsettings.synonym_type_accession_code


class Batch(DescribableEntity):
    """
    Batch for an accession.
    """

    # name validator, used with content validation, to avoid any whitespace before and after
    NAME_VALIDATOR = {"type": "string", "minLength": 3, "maxLength": 128, "pattern": r"^\S+.+\S+$"}

    # unique name of the batch
    name = models.CharField(unique=True, max_length=255, db_index=True)

    # parent accession
    accession = models.ForeignKey('Accession', related_name='batches')

    # direct parent batches
    batches = models.ManyToManyField('Batch', related_name='children')

    class Meta:
        verbose_name = _("batch")

        permissions = (
            ("get_batch", "Can get a batch"),
            ("list_batch", "Can list batch"),
            ("search_batch", "Can search for batches")
        )

    def natural_name(self):
        return self.name

    @classmethod
    def make_search_by_name(cls, term):
        return Q(name__istartswith=term)

    def audit_create(self, user):
        return {
            'name': self.name,
            'accession': self.accession_id,
            'descriptor_meta_model': self.descriptor_meta_model_id,
            'descriptors': self.descriptors
        }

    def audit_update(self, user):
        if hasattr(self, 'updated_fields'):
            result = {'updated_fields': self.updated_fields}

            if 'name' in self.updated_fields:
                result['name'] = self.name

            if 'descriptors' in self.updated_fields:
                if hasattr(self, 'descriptors_diff'):
                    result['descriptors'] = self.descriptors_diff
                else:
                    result['descriptors'] = self.descriptors

            return result
        else:
            return {
                'name': self.name,
                'descriptors': self.descriptors
            }

    def audit_delete(self, user):
        return {
            'name': self.name
        }


class Sample(DescribableEntity):
    """
    Sample during lot processing.
    """

    # name validator, used with content validation, to avoid any whitespace before and after
    NAME_VALIDATOR = {"type": "string", "minLength": 3, "maxLength": 128, "pattern": r"^\S+.+\S+$"}

    # unique name of sample
    name = models.CharField(unique=True, max_length=255, db_index=True)

    # related batch
    batch = models.ForeignKey('Batch', related_name='samples')

    class Meta:
        verbose_name = _("sample")

    def natural_name(self):
        return self.name

    @classmethod
    def make_search_by_name(cls, term):
        return Q(name__istartswith=term)

    def audit_create(self, user):
        return {
            'name': self.name,
            'batch': self.batch_id,
            'descriptor_meta_model': self.descriptor_meta_model_id,
            'descriptors': self.descriptors
        }

    def audit_update(self, user):
        if hasattr(self, 'updated_fields'):
            result = {'updated_fields': self.updated_fields}

            if 'name' in self.updated_fields:
                result['name'] = self.name

            if 'descriptors' in self.updated_fields:
                if hasattr(self, 'descriptors_diff'):
                    result['descriptors'] = self.descriptors_diff
                else:
                    result['descriptors'] = self.descriptors

            return result
        else:
            return {
                'name': self.name,
                'descriptors': self.descriptors
            }

    def audit_delete(self, user):
        return {
            'name': self.name
        }


class BatchActionType(ChoiceEnum):
    """
    Type of batch-action.
    """

    INTRODUCTION = IntegerChoice(0, _('Introduction'))
    MULTIPLICATION = IntegerChoice(1, _('Multiplication'))
    REGENERATION = IntegerChoice(2, _('Regeneration'))
    TEST = IntegerChoice(3, _('Test'))
    CLEANUP = IntegerChoice(4, _('Clean-up'))
    SAMPLE = IntegerChoice(5, _('Sample'))
    DISPATCH = IntegerChoice(6, _('Dispatch'))
    ELIMINATION = IntegerChoice(7, _('Elimination'))


class BatchAction(models.Model):
    """
    A batch-action defines a process of creation or update of one or more output batches and a list of input batches
    altered or not modified, plus the relating accession.
    """

    # actor of the action
    user = models.ForeignKey(User)

    # date of the action
    created_date = models.DateTimeField(auto_now_add=True)

    # action type
    type = models.IntegerField(
        choices=BatchActionType.choices(), default=BatchActionType.INTRODUCTION.value, db_index=True)

    # related parent accession
    accession = models.ForeignKey(Accession, db_index=True)

    # list of initials batches used as parent for the creation of target batches
    input_batches = models.ManyToManyField(Batch, related_name='+')

    # list of created or updated batches
    output_batches = models.ManyToManyField(Batch, related_name='+')

    class Meta:
        verbose_name = _("batch action")

        index_together = (("accession", "type"),)

        default_permissions = list()


class Panel(Entity):
    """
    A Panel...
    """

    # unique name of the panel
    name = models.CharField(unique=True, max_length=255, db_index=True)

    # JSONB field containing the list of descriptors model type id as key, with a descriptor value or value code.
    descriptors = JSONField(default={})

    # It refers to a set of models of type of descriptors through a meta-model of descriptor.
    # It can be null because it is possible to have the choice to defines or not some descriptors
    descriptor_meta_model = models.ForeignKey(DescriptorMetaModel, null=True)

    class Meta:
        abstract = True

    def natural_name(self):
        return self.name

    @classmethod
    def make_search_by_name(cls, term):
        return Q(name__istartswith=term)


class BatchPanel(Panel):
    """
    Defines a collection of batches
    """

    # list of batches
    batches = models.ManyToManyField(Batch)

    @classmethod
    def get_defaults_columns(cls):
        return {
            'descriptor_meta_model': {
                'label': _('Model'),
                'field': 'name',
                'query': True,
                'format': {
                    'type': 'descriptor_meta_model',
                    'model': 'accession.batchpanel'
                },
                'available_operators': ['isnull', 'notnull', 'eq', 'neq', 'in', 'notin']
            },
            'name': {
                'label': _('Name'),
                'query': False,  # done by a prefetch related
                'format': {
                    'type': 'string',
                    'model': 'accession.batchpanel'
                },
                'available_operators': ['isnull', 'notnull', 'eq', 'neq', 'icontains']
            }
        }

    class Meta:
        verbose_name = _("batch panel")

        permissions = (
            ("get_batchpanel", "Can get a batch panel"),
            ("list_batchpanel", "Can list batch panel"),
        )


class AccessionPanel(Panel):
    """
    Defines a collection of accessions
    """

    # related accessions
    accessions = models.ManyToManyField(Accession)

    @classmethod
    def get_defaults_columns(cls):
        return {
            'descriptor_meta_model': {
                'label': _('Model'),
                'field': 'name',
                'query': True,
                'format': {
                    'type': 'descriptor_meta_model',
                    'model': 'accession.accessionpanel'
                },
                'available_operators': ['isnull', 'notnull', 'eq', 'neq', 'in', 'notin']
            },
            'name': {
                'label': _('Name'),
                'query': False,  # done by a prefetch related
                'format': {
                    'type': 'string',
                    'model': 'accession.accessionpanel'
                },
                'available_operators': ['isnull', 'notnull', 'eq', 'neq', 'icontains']
            }
        }

    class Meta:
        verbose_name = _("accession panel")

        permissions = (
            ("get_accessionpanel", "Can get a accession panel"),
            ("list_accessionpanel", "Can list accession panel"),
        )
