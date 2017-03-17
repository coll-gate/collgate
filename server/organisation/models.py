# -*- coding: utf-8; -*-
#
# Copyright (c) 2017 INRA UMR1095 GDEC

"""
coll-gate organisation models.
"""

from django.core.exceptions import ObjectDoesNotExist
from django.db import models
from django.db.models import Q
from django.utils.translation import ugettext_lazy as _

from descriptor.models import DescribableEntity, DescriptorType


class Organisation(DescribableEntity):
    """
    Organisation entity for management level.
    The descriptor meta-model is defined to the unique name "organisation".
    """

    # name validator, used with content validation, to avoid any whitespace before and after
    NAME_VALIDATOR = {"type": "string", "minLength": 3, "maxLength": 128, "pattern": r"^\S+.+\S+$"}

    # organisation type validator
    TYPE_VALIDATOR = {"type:": "string", 'minLength': 14, 'maxLength': 32, "pattern": r"^OR_001:[0-9]{7,}$"}

    # organisation type validator optional
    TYPE_VALIDATOR_OPTIONAL = {
        "type:": "string", 'minLength': 14, 'maxLength': 32, "pattern": r"^OR_001:[0-9]{7,}$", "required": False}

    # Descriptor type code
    TYPE_CODE = "OR_001"

    # undefined type as constant
    TYPE_UNDEFINED = "OR_001:0000001"

    # unique name of the organisation
    name = models.CharField(unique=True, max_length=255, db_index=True)

    # type of organisation is related to the type of descriptor IN_002 that is an 'enum_single'.
    type = models.CharField(max_length=16, default=TYPE_UNDEFINED)

    class Meta:
        verbose_name = _("Organisation")

    def natural_name(self):
        return self.descriptors["organisation_acronym"]

    @classmethod
    def make_search_by_name(cls, term):
        return Q(name__istartswith=term) | Q(descriptors__organisation_acronym=term)

    def audit_create(self, user):
        return {
            'name': self.name,
            'type': self.type,
            'descriptor_meta_model': self.descriptor_meta_model_id,
            'descriptors': self.descriptors
        }

    def audit_update(self, user):
        if hasattr(self, 'updated_fields'):
            result = {'updated_fields': self.updated_fields}

            if 'name' in self.updated_fields:
                result['name'] = self.name

            if 'type' in self.updated_fields:
                result['type'] = self.type

            if 'descriptors' in self.updated_fields:
                if hasattr(self, 'descriptors_diff'):
                    result['descriptors'] = self.descriptors_diff
                else:
                    result['descriptors'] = self.descriptors

            return result
        else:
            return {
                'name': self.name,
                'type': self.type,
                'descriptors': self.descriptors
            }

    def audit_delete(self, user):
        return {
            'name': self.name
        }

    def in_usage(self):
        return self.establishments.all().exists()

    @classmethod
    def is_type(cls, organisation_type):
        descriptor_type = DescriptorType.objects.get(code=cls.TYPE_CODE)

        try:
            descriptor_type.get_value(organisation_type)
        except ObjectDoesNotExist:
            return False

        return True


class Establishment(DescribableEntity):
    """
    Location for an organisation.
    The descriptor meta-model is defined to the unique name "establishment".
    """

    # name validator, used with content validation, to avoid any whitespace before and after
    NAME_VALIDATOR = {"type": "string", "minLength": 3, "maxLength": 128, "pattern": r"^\S+.+\S+$"}

    # unique name of establishment
    name = models.CharField(unique=True, max_length=255, db_index=True)

    # related organisation
    organisation = models.ForeignKey(Organisation, on_delete=models.CASCADE, related_name="establishments")

    class Meta:
        verbose_name = _("Establishment")

    def natural_name(self):
        return self.name

    @classmethod
    def make_search_by_name(cls, term):
        return Q(name__istartswith=term)

    def audit_create(self, user):
        return {
            'name': self.name,
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


class GRCManager(models.Manager):
    def get_unique_grc(self):
        return self.all()[0]


class GRC(models.Model):
    """
    Genetic resource center entity. Only one is configured for the application instance.
    """

    NAME_VALIDATOR = {"type": "string", "minLength": 1, "maxLength": 256, "pattern": r"^\S+.+\S+$"}

    IDENTIFIER_VALIDATOR = {"type": "string", "minLength": 1, "maxLength": 256, "pattern": r"^\S+.+\S+$"}

    # name of the GRC
    name = models.CharField(max_length=256, default="Undefined GRC", blank=False)

    # identifier code or the GRC (@see code view of the FAO http://www.fao.org/wiews)
    identifier = models.CharField(max_length=256, default="undefined", blank=False)

    # general description
    description = models.TextField(default="", blank=True, null=False)

    # list of managers organisations
    organisations = models.ManyToManyField(Organisation)

    class Meta:
        verbose_name = _("Genetic Resource Center")

    objects = GRCManager()

# @todo Contact for an establishment