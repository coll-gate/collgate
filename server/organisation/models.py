# -*- coding: utf-8; -*-
#
# @file models.py
# @brief coll-gate organisation models.
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2017-01-03
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details
import re

from django.core.exceptions import ObjectDoesNotExist
from django.db import models
from django.db.models import Q
from django.utils.translation import ugettext_lazy as _
from igdectk.common.models import ChoiceEnum, IntegerChoice

from descriptor.models import DescribableEntity, Descriptor


class Organisation(DescribableEntity):
    """
    Organisation entity for management level.
    The descriptor layout is defined to the unique name "organisation".
    """

    # name validator, used with content validation, to avoid any whitespace before and after
    NAME_VALIDATOR = {"type": "string", "minLength": 3, "maxLength": 255, "pattern": r"^\S+.+\S+$"}

    # organisation type validator
    TYPE_VALIDATOR = {"type:": "string", 'minLength': 10, 'maxLength': 18, "pattern": r"^ORG_TYPE:[0-9]{1,9}$"}

    # organisation type validator optional
    TYPE_VALIDATOR_OPTIONAL = {
        "type:": "string", 'minLength': 10, 'maxLength': 18, "pattern": r"^ORG_TYPE:[0-9]{1,9}$", "required": False}

    # Descriptor type code
    TYPE_CODE = "ORG_TYPE"

    # undefined type as constant
    TYPE_UNDEFINED = "ORG_TYPE:01"

    # unique name of the organisation
    name = models.CharField(unique=True, max_length=255, db_index=True)

    # type of organisation is related to the type of descriptor that is an 'enum_single'.
    type = models.CharField(max_length=16, default=TYPE_UNDEFINED)

    @classmethod
    def get_defaults_columns(cls):
        return {
            'name': {
                'label': _('Name'),
                'query': False,
                'format': {
                    'type': 'string',
                    'model': 'organisation.organisation'
                },
                'available_operators': ['isnull', 'notnull', 'eq', 'neq', 'icontains']
            },
            'layout': {
                'label': _('Layout'),
                'field': 'name',
                'query': True,
                'format': {
                    'type': 'layout',
                    'model': 'organisation.organisation'
                },
                'available_operators': ['isnull', 'notnull', 'eq', 'neq', 'in', 'notin']
            },
            'type': {
                'label': _('Type'),
                'field': 'name',
                'query': False,
                'code': Organisation.TYPE_CODE,  # @todo dynamic ?
                'format': {
                    'type': 'enum_single',
                    'fields': ['name'],
                    'trans': True,
                    'list_type': 'dropdown',
                    'display_fields': 'value0',
                    'sortby_field': 'value0'
                }
            },
            'grc': {
                'label': _('Partner'),
                'field': 'grcs',
                'query': False,
                'format': {
                    'type': 'count',
                    'fields': ['grcs']
                }
            },
            'num_establishments': {
                'label': _('Establishments'),
                'field': 'establishments',
                'query': False,
                'format': {
                    'type': 'count',
                    'fields': ['establishments']
                }
            }
        }

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
            'layout': self.layout_id,
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
                if hasattr(self, 'updated_descriptors'):
                    result['descriptors'] = self.updated_descriptors
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
        descriptor = Descriptor.objects.get(code=cls.TYPE_CODE)

        try:
            descriptor.get_value(organisation_type)
        except ObjectDoesNotExist:
            return False

        return True


class Establishment(DescribableEntity):
    """
    Location for an organisation.
    The descriptor layout is defined to the unique name "establishment".
    """

    # name validator, used with content validation, to avoid any whitespace before and after
    NAME_VALIDATOR = {"type": "string", "minLength": 3, "maxLength": 255, "pattern": r"^\S+.+\S+$"}

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

    @classmethod
    def get_defaults_columns(cls):
        return {
            'name': {
                'label': _('Name'),
                'query': False,
                'format': {
                    'type': 'string',
                    'model': 'organisation.establishment'
                },
                'available_operators': ['isnull', 'notnull', 'eq', 'neq', 'icontains']
            },
            'layout': {
                'label': _('Layout'),
                'field': 'name',
                'query': True,
                'format': {
                    'type': 'layout',
                    'model': 'organisation.establishment'
                },
                'available_operators': ['isnull', 'notnull', 'eq', 'neq', 'in', 'notin']
            }
        }

    def audit_create(self, user):
        return {
            'name': self.name,
            'layout': self.layout_id,
            'descriptors': self.descriptors
        }

    def audit_update(self, user):
        if hasattr(self, 'updated_fields'):
            result = {'updated_fields': self.updated_fields}

            if 'name' in self.updated_fields:
                result['name'] = self.name

            if 'descriptors' in self.updated_fields:
                if hasattr(self, 'updated_descriptors'):
                    result['descriptors'] = self.updated_descriptors
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

    NAME_VALIDATOR = {"type": "string", "minLength": 1, "maxLength": 255, "pattern": r"^\S+.+\S+$"}

    IDENTIFIER_VALIDATOR = {"type": "string", "minLength": 1, "maxLength": 255, "pattern": r"^\S+.+\S+$"}

    # name of the GRC
    name = models.CharField(max_length=255, default="Undefined GRC", blank=False)

    # identifier code or the GRC (@see code view of the FAO http://www.fao.org/wiews)
    identifier = models.CharField(max_length=255, default="undefined", blank=False)

    # general description (JSON stored dict with multiple languages codes)
    # at this day only used as a simple text field without i18n
    description = models.TextField(default="", blank=True, null=False)

    # list of managers organisations
    organisations = models.ManyToManyField(Organisation, related_name="grcs")

    class Meta:
        verbose_name = _("Genetic Resource Center")

    objects = GRCManager()


class Conservatory(DescribableEntity):
    """
    A physical or logical conservatory for storage.
    """

    # name validator, used with content validation, to avoid any whitespace before and after
    NAME_VALIDATOR = {"type": "string", "minLength": 3, "maxLength": 255, "pattern": r"^\S+.+\S+$"}

    # name validator
    NAME_VALIDATOR_OPTIONAL = {"type": "string", "minLength": 1, "maxLength": 255, "pattern": "^\S+.+\S+$", "required": False}

    # unique client code
    name = models.CharField(unique=True, max_length=255, db_index=True)

    # related establishment
    establishment = models.ForeignKey(Establishment, null=True, on_delete=models.CASCADE)

    class Meta:
        verbose_name = _("Conservatory")

    def natural_name(self):
        return self.name

    @classmethod
    def make_search_by_name(cls, term):
        return Q(name__istartswith=term)

    @classmethod
    def get_defaults_columns(cls):
        return {
            'name': {
                'label': _('Name'),
                'query': False,
                'format': {
                    'type': 'string',
                    'model': 'organisation.conservatory'
                },
                'available_operators': ['isnull', 'notnull', 'eq', 'neq', 'icontains']
            },
            'layout': {
                'label': _('Layout'),
                'field': 'name',
                'query': True,
                'format': {
                    'type': 'layout',
                    'model': 'organisation.conservatory'
                },
                'available_operators': ['isnull', 'notnull', 'eq', 'neq', 'in', 'notin']
            }
        }

    def audit_create(self, user):
        return {
            'code': self.name,
            'layout': self.layout_id,
            'descriptors': self.descriptors
        }

    def audit_update(self, user):
        if hasattr(self, 'updated_fields'):
            result = {'updated_fields': self.updated_fields}

            if 'code' in self.updated_fields:
                result['code'] = self.name

            if 'descriptors' in self.updated_fields:
                if hasattr(self, 'updated_descriptors'):
                    result['descriptors'] = self.updated_descriptors
                else:
                    result['descriptors'] = self.descriptors

            return result
        else:
            return {
                'code': self.name,
                'descriptors': self.descriptors
            }

    def audit_delete(self, user):
        return {
            'code': self.name
        }


class PersonType(ChoiceEnum):
    """
    Type of a person.
    """

    PHYSICAL_PERSON = IntegerChoice(0, _('Physical person'))
    MORAL_PERSON = IntegerChoice(1, _('Moral person'))
    CONTACT = IntegerChoice(2, _('Contact'))


class ContactType(ChoiceEnum):
    """
    Type of a contact person.
    """

    CONTACT = IntegerChoice(0, _('Contact'))
    DONOR = IntegerChoice(1, _('Donor'))
    SELECTOR = IntegerChoice(1, _('Selector'))


class Person(DescribableEntity):
    """
    Can be a physical person or moral person, used as a contact or as a donor/selector
    As a describable entity details are in json field.
    """

    # code pattern
    CODE_RE = re.compile(r"^\S+.+\S+$", re.IGNORECASE)

    # code validator
    CODE_VALIDATOR = {"type": "string", "minLength": 1, "maxLength": 255, "pattern": "^\S+.+\S+$"}

    # code validator
    CODE_VALIDATOR_OPTIONAL = {"type": "string", "minLength": 1, "maxLength": 255, "pattern": "^\S+.+\S+$", "required": False}

    # unique client code
    code = models.CharField(unique=True, max_length=255, db_index=True)

    # type of person
    person_type = models.IntegerField(choices=PersonType.choices(), default=PersonType.PHYSICAL_PERSON.value)

    # type of contact
    contact_type = models.IntegerField(choices=ContactType.choices(), default=ContactType.CONTACT.value)

    # related establishment
    establishment = models.ForeignKey(Establishment, null=True, on_delete=models.SET_NULL)

    class Meta:
        verbose_name = _("Person")

    def natural_name(self):
        return self.code

    @classmethod
    def make_search_by_name(cls, term):
        return Q(code__istartswith=term)

    @classmethod
    def get_defaults_columns(cls):
        return {
            'code': {
                'label': _('Code'),
                'query': False,
                'format': {
                    'type': 'string',
                    'model': 'organisation.person'
                },
                'available_operators': ['isnull', 'notnull', 'eq', 'neq', 'icontains']
            },
            'layout': {
                'label': _('Layout'),
                'field': 'name',
                'query': True,
                'format': {
                    'type': 'layout',
                    'model': 'organisation.establishment'
                },
                'available_operators': ['isnull', 'notnull', 'eq', 'neq', 'in', 'notin']
            }
        }

    def audit_create(self, user):
        return {
            'code': self.code,
            'layout': self.layout_id,
            'descriptors': self.descriptors
        }

    def audit_update(self, user):
        if hasattr(self, 'updated_fields'):
            result = {'updated_fields': self.updated_fields}

            if 'code' in self.updated_fields:
                result['code'] = self.code

            if 'descriptors' in self.updated_fields:
                if hasattr(self, 'updated_descriptors'):
                    result['descriptors'] = self.updated_descriptors
                else:
                    result['descriptors'] = self.descriptors

            return result
        else:
            return {
                'code': self.code,
                'descriptors': self.descriptors
            }

    def audit_delete(self, user):
        return {
            'code': self.code
        }
