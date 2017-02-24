# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
coll-gate accession module models.
"""
from django.contrib.auth.models import User
from django.core.exceptions import ObjectDoesNotExist
from django.utils.translation import ugettext_lazy as _
from django.db import models

from igdectk.common.models import ChoiceEnum, IntegerChoice

from main.models import Languages, Entity
from descriptor.models import DescribableEntity, DescriptorType
from taxonomy.models import Taxon


class Asset(Entity):
    """
    Defines a collection of accessions, with particular permissions on it.
    """

    accessions = models.ManyToManyField('Accession', related_name='assets')

    class Meta:
        verbose_name = _("panel")


class Accession(DescribableEntity):
    """
    Accession entity defines a physical or virtual accession.
    """

    # inherit of a taxon rank
    parent = models.ForeignKey(Taxon)

    class Meta:
        verbose_name = _("accession")

        permissions = (
            ("get_accession", "Can get an accession"),
            ("list_accession", "Can list accessions"),
            ("search_accession", "Can search for accessions")
        )

    def audit_create(self, user):
        return {
            'parent': self.parent_id,
            'descriptor_meta_model': self.descriptor_meta_model_id,
            'descriptors': self.descriptors
        }

    def audit_update(self, user):
        if hasattr(self, 'updated_fields'):
            result = {'updated_fields': self.updated_fields}

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
                'descriptors': self.descriptors
            }

    def audit_delete(self, user):
        return {}


class AccessionSynonym(Entity):
    """
    Table specific to accession to defines the synonyms.
    """

    # name validator, used with content validation, to avoid any whitespace before and after
    NAME_VALIDATOR = {"type": "string", "minLength": 3, "maxLength": 128, "pattern": r"^\S+.+\S+$"}

    # accession synonym type validator
    TYPE_VALIDATOR = {"type:": "string", 'minLength': 14, 'maxLength': 32, "pattern": r"^IN_001:[0-9]{7,}$"}

    # Descriptor type code
    TYPE_CODE = "IN_001"

    # primary type as constant
    TYPE_PRIMARY = "IN_001:0000001"

    # related accession
    accession = models.ForeignKey(Accession, related_name="synonyms")

    # synonym name
    synonym = models.CharField(max_length=255, db_index=True)

    # language code
    language = models.CharField(max_length=8, choices=Languages.choices(), default=Languages.EN.value)

    # type of synonym is related to the type of descriptor IN_001 that is an 'enum_single'.
    type = models.CharField(max_length=64, default=TYPE_PRIMARY)

    class Meta:
        verbose_name = _("accession synonym")

    @classmethod
    def is_synonym_type(cls, synonym_type):
        descriptor_type = DescriptorType.objects.get(code=AccessionSynonym.TYPE_CODE)

        try:
            descriptor_type.get_value(synonym_type)
        except ObjectDoesNotExist:
            return False

        return True

    def is_primary(self):
        """
        Is a primary type of synonym.
        :return: True if primary
        """
        return self.type == AccessionSynonym.TYPE_PRIMARY


class Batch(DescribableEntity):
    """
    Batch for an accession.
    """

    # name validator, used with content validation, to avoid any whitespace before and after
    NAME_VALIDATOR = {"type": "string", "minLength": 3, "maxLength": 128, "pattern": r"^\S+.+\S+$"}

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

    def audit_create(self, user):
        return {
            'accession': self.accession_id,
            'descriptor_meta_model': self.descriptor_meta_model_id,
            'descriptors': self.descriptors
        }

    def audit_update(self, user):
        if hasattr(self, 'updated_fields'):
            result = {'updated_fields': self.updated_fields}

            if 'descriptors' in self.updated_fields:
                if hasattr(self, 'descriptors_diff'):
                    result['descriptors'] = self.descriptors_diff
                else:
                    result['descriptors'] = self.descriptors

            return result
        else:
            return {
                'descriptors': self.descriptors
            }

    def audit_delete(self, user):
        return {}


class Sample(DescribableEntity):
    """
    Sample during lot processing.
    """

    # name validator, used with content validation, to avoid any whitespace before and after
    NAME_VALIDATOR = {"type": "string", "minLength": 3, "maxLength": 128, "pattern": r"^\S+.+\S+$"}

    batch = models.ForeignKey('Batch', related_name='samples')

    class Meta:
        verbose_name = _("sample")

    def audit_create(self, user):
        return {
            'batch': self.batch_id,
            'descriptor_meta_model': self.descriptor_meta_model_id,
            'descriptors': self.descriptors
        }

    def audit_update(self, user):
        if hasattr(self, 'updated_fields'):
            result = {'updated_fields': self.updated_fields}

            if 'descriptors' in self.updated_fields:
                if hasattr(self, 'descriptors_diff'):
                    result['descriptors'] = self.descriptors_diff
                else:
                    result['descriptors'] = self.descriptors

            return result
        else:
            return {
                'descriptors': self.descriptors
            }

    def audit_delete(self, user):
        return {}


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
