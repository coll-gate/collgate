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
from django.core.exceptions import ObjectDoesNotExist
from django.db.models import Q
from django.db import models
from django.utils.translation import ugettext_lazy as _

from igdectk.common.models import ChoiceEnum, IntegerChoice

from main.models import Entity
from descriptor.models import DescribableEntity, DescriptorType
from classification.models import Taxon


class Asset(Entity):
    """
    Defines a collection of accessions, with particular permissions on it.
    """

    # unique name of the asset
    name = models.CharField(unique=True, max_length=255, db_index=True)

    # related accession
    accessions = models.ManyToManyField('Accession', related_name='assets')

    class Meta:
        verbose_name = _("panel")

    def natural_name(self):
        return self.name

    @classmethod
    def make_search_by_name(cls, term):
        return Q(name__istartswith=term)


class Accession(DescribableEntity):
    """
    Accession entity defines a physical or virtual accession.
    """

    # simple name pattern with alphanumeric characters plus _ and - with a least a length of 1
    NAME_RE = re.compile(r'^[a-zA-Z0-9_-]+$', re.IGNORECASE)

    # default name validator
    NAME_VALIDATOR = {"type": "string", "minLength": 1, "maxLength": 32, "pattern": "^[a-zA-Z0-9\-\_]+$"}

    # non-unique primary name of the accession
    name = models.CharField(max_length=255, db_index=True)

    # unique GRC code of the accession
    code = models.CharField(unique=True, max_length=255, db_index=True)

    # inherit of a taxon rank
    parent = models.ForeignKey(Taxon)

    @classmethod
    def get_defaults_columns(cls):
        return {
            'parent': {
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
                    'model': 'accession.accession'
                }
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
            'parent': self.parent_id,
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

            if 'parent' in self.updated_fields:
                result['parent'] = self.parent_id

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
                'parent': self.parent_id,
                'descriptors': self.descriptors
            }

    def audit_delete(self, user):
        return {
            'name': self.name
        }


class AccessionSynonym(Entity):
    """
    Table specific to accession to defines the synonyms.
    """

    # name validator, used with content validation, to avoid any whitespace before and after
    NAME_VALIDATOR = {"type": "string", "minLength": 1, "maxLength": 128, "pattern": r"^\S+.+\S+$"}

    # code validator, used with content validation, to avoid any whitespace before and after
    CODE_VALIDATOR = {"type": "string", "minLength": 1, "maxLength": 128, "pattern": r"^\S+.+\S+$"}

    # accession synonym type validator
    TYPE_VALIDATOR = {"type:": "string", 'minLength': 9, 'maxLength': 17, "pattern": r"^ACC_SYN:[0-9]{1,9}$"}

    # static : Descriptor type code
    DESCRIPTOR_TYPE_CODE = "ACC_SYN"

    # static : unique code type as constant
    TYPE_GRC_CODE = "ACC_SYN:01"

    # static : primary name type as constant
    TYPE_PRIMARY = "ACC_SYN:02"

    # static : synonym name type as constant
    TYPE_SYNONYM = "ACC_SYN:03"

    # related accession
    accession = models.ForeignKey(Accession, related_name="synonyms")

    # synonym display name
    name = models.CharField(max_length=255, db_index=True)

    # language code
    language = models.CharField(max_length=5, default="en")

    # type of synonym is related to the type of descriptor TYPE_CODE that is an 'enum_single'.
    type = models.CharField(max_length=64, default=TYPE_SYNONYM)

    class Meta:
        verbose_name = _("accession synonym")

    @classmethod
    def is_synonym_type(cls, synonym_type):
        descriptor_type = DescriptorType.objects.get(code=AccessionSynonym.DESCRIPTOR_TYPE_CODE)

        try:
            descriptor_type.get_value(synonym_type)
        except ObjectDoesNotExist:
            return False

        return True

    def is_grc_code(self):
        """
        Is a GRC code type of synonym.
        :return: True if GRC code
        """
        return self.type == AccessionSynonym.TYPE_GRC_CODE

    def is_primary(self):
        """
        Is a primary name type of synonym.
        :return: True if primary name
        """
        return self.type == AccessionSynonym.TYPE_PRIMARY

    def natural_name(self):
        return self.name

    @classmethod
    def make_search_by_name(cls, term):
        return Q(name__istartswith=term)

    def audit_create(self, user):
        return {
            'accession': self.accession_id,
            'name': self.name,
            'type': self.type,
            'language': self.language
        }

    def audit_update(self, user):
        if hasattr(self, 'updated_fields'):
            result = {'updated_fields': self.updated_fields}

            if 'name' in self.updated_fields:
                result['name'] = self.name

            if 'type' in self.updated_fields:
                result['type'] = self.type

            if 'language' in self.updated_fields:
                result['language'] = self.language

            return result
        else:
            return {
                'name': self.name,
                'type': self.type,
                'language': self.language,
            }

    def audit_delete(self, user):
        return {
            'name': self.name
        }


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
        index_together = (("accession", "type"),)

        default_permissions = list()
