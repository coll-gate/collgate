# -*- coding: utf-8; -*-
#
# Copyright (c) 2017 INRA UMR1095 GDEC

"""
coll-gate descriptor format type class
"""

import re
import decimal

import validictory
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ObjectDoesNotExist, ImproperlyConfigured
from django.shortcuts import get_object_or_404
from django.utils.translation import ugettext_lazy as _, pgettext_lazy


class DescriptorFormatTypeGroup(object):
    """
    Group of descriptor format type.
    """

    def __init__(self, name, verbose_name):
        self.name = name
        self.verbose_name = verbose_name


class DescriptorFormatType(object):
    """
    Descriptor format type class model.
    """

    def __init__(self):
        # name referred as a code, stored in format.type.
        self.name = ''

        # related group as string in way to organise type into a select view.
        self.group = None

        # i18n verbose name displayable for the client
        self.verbose_name = ''

        # list of related field into format.*.
        self.format_fields = ["type"]

    def validate(self, descriptor_type_format, value, descriptor_model_type):
        """
        Validate the value according the format. self.error contains the details of the error if False is returned.
        :param descriptor_type_format: Format of the related type of descriptor
        :param value: Value to validate
        :param descriptor_model_type: related descriptor model type
        :return: None if the validation is done, else a string with the error detail
        """
        return None

    def check(self, descriptor_type_format):
        """
        Check the format of a descriptor type, if it is valid for a specific type of format.
        :param descriptor_type_format: Format of type of descriptor to check
        :return: None if the check is done, else a string with the error detail
        """
        return None


class DescriptorFormatTypeManager(object):
    """
    Singleton manager of set of descriptor format type.
    """

    descriptor_format_types = {}

    @classmethod
    def register(cls, descriptor_format_types_list):
        """
        Register a list of descriptor format type.
        :param descriptor_format_types_list: An array of descriptor format type.
        """
        # register each type into a map
        for dft in descriptor_format_types_list:
            if dft.name in cls.descriptor_format_types:
                raise ImproperlyConfigured("Descriptor format type not already defined (%s)" % dft.name)

            cls.descriptor_format_types[dft.name] = dft

    @classmethod
    def validate(cls, descriptor_type_format, value, descriptor_model_type):
        """
        Call the validate of the correct descriptor format type.
        :param descriptor_type_format: Format of the type of descriptor as python dict
        :param value: Value to validate
        :param descriptor_model_type: Related type of model of descriptor
        :except ValueError with descriptor of the problem
        """
        format_type = descriptor_type_format['type']

        dft = cls.descriptor_format_types.get(format_type)
        if dft is None:
            raise ValueError("Unsupported descriptor format type %s" % format_type)

        res = dft.validate(descriptor_type_format, value, descriptor_model_type)
        if res is not None:
            raise ValueError(dft.error + " (%s)" % descriptor_model_type.get_label())

    @classmethod
    def check(cls, descriptor_type_format):
        """
        Call the check of the correct descriptor format type.
        :param descriptor_type_format: Format of the type of descriptor as python dict
        :return: True if check success.
        :except ValueError with descriptor of the problem
        """
        format_type = descriptor_type_format['type']

        dft = cls.descriptor_format_types.get(format_type)
        if dft is None:
            raise ValueError("Unsupported descriptor format type %s" % format_type)

        res = dft.check(descriptor_type_format)
        if res is not None:
            raise ValueError(str(res))

    @classmethod
    def values(cls):
        """
        Return the list of any registered descriptor format types.
        """
        return list(cls.descriptor_format_types.values())


class DescriptorFormatTypeGroupSingle(DescriptorFormatTypeGroup):
    """
    Group of single values descriptors.
    """

    def __init__(self):
        super().__init__("single", _("Single value"))


class DescriptorFormatTypeGroupList(DescriptorFormatTypeGroup):
    """
    Group of list of values descriptors.
    """

    def __init__(self):
        super().__init__("list", _("List of values"))


class DescriptorFormatTypeEnumSingle(DescriptorFormatType):
    """
    Specialisation for single list of values.
    """

    def __init__(self):
        super().__init__()

        self.name = "enum_single"
        self.group = DescriptorFormatTypeGroupList()
        self.verbose_name = _("Single enumeration")
        self.format_fields = [
            "type", "trans", "fields", "list_type", "sortby_field", "display_fields", "search_field"
        ]

    def validate(self, descriptor_type_format, value, descriptor_model_type):
        # check if the value is a string and exists into the type of descriptor
        if not isinstance(value, str):
            return _("The descriptor value must be a string")

        # check if the value exists
        try:
            descriptor_model_type.descriptor_type.get_value(value)
        except ObjectDoesNotExist:
            return _("The descriptor value must exists")

        return None

    def check(self, descriptor_type_format):
        schema = {
            "type": "object",
            "properties": {
                "fields": {"type": "array", 'minLength': 1, 'maxLength': 1, 'items': [
                        {'type': 'string', 'minLength': 0, 'maxLength': 32, 'blank': True}
                    ]
                },
                "trans": {"type": "boolean"},
                "sortby_field": {"type": "string", "enum": ['code', 'value0']},
                "display_fields": {"type": "string", "enum": ['value0']},
                "list_type": {"type": "string", "enum": ['dropdown', 'autocomplete']},
                "search_field": {"type": "string", "enum": ['value0']}
            }
        }

        try:
            validictory.validate(descriptor_type_format, schema)
        except validictory.MultipleValidationError as e:
            return str(e)

        return None


class DescriptorFormatTypeEnumPair(DescriptorFormatType):
    """
    Specialisation for list of pair of values.
    """

    def __init__(self):
        super().__init__()

        self.name = "enum_pair"
        self.group = DescriptorFormatTypeGroupList()
        self.verbose_name = _("Pair enumeration")
        self.format_fields = [
            "type", "trans", "fields", "list_type", "sortby_field", "display_fields", "search_field"
        ]

    def validate(self, descriptor_type_format, value, descriptor_model_type):
        # check if the value is a string and exists into the type of descriptor
        if not isinstance(value, str):
            return _("The descriptor value must be a string")

        # check if the value exists
        try:
            descriptor_model_type.descriptor_type.get_value(value)
        except ObjectDoesNotExist:
            return _("The descriptor value must exists")

        return None

    def check(self, descriptor_type_format):
        schema = {
            "type": "object",
            "properties": {
                "fields": {"type": "array", 'minLength': 2, 'maxLength': 2, 'items': [
                        {'type': 'string', 'minLength': 0, 'maxLength': 32, 'blank': True},
                        {'type': 'string', 'minLength': 0, 'maxLength': 32, 'blank': True}
                    ]
                },
                "trans": {"type": "boolean"},
                "sortby_field": {"type": "string", "enum": ['code', 'value0', 'value1']},
                "display_fields": {"type": "string",
                                   "enum": ['value0', 'value1', 'value0-value1', 'hier0-value1']},
                "list_type": {"type": "string", "enum": ['dropdown', 'autocomplete']},
                "search_field": {"type": "string", "enum": ['value0', 'value1']}
            }
        }

        try:
            validictory.validate(descriptor_type_format, schema)
        except validictory.MultipleValidationError as e:
            return str(e)

        return None


class DescriptorFormatTypeEnumOrdinal(DescriptorFormatType):
    """
    Specialisation for list of pair of values.
    """

    def __init__(self):
        super().__init__()

        self.name = "enum_ordinal"
        self.group = DescriptorFormatTypeGroupList()
        self.verbose_name = _("Ordinal with text")
        self.format_fields = [
            "type", "trans", "fields", "list_type", "sortby_field", "display_fields", "search_field"
        ]

    def validate(self, descriptor_type_format, value, descriptor_model_type):
        # check if the value is a string and exists into the type of descriptor
        if not isinstance(value, str):
            return _("The descriptor value must be a string")

        # check if the value exists
        try:
            descriptor_model_type.descriptor_type.get_value(value)
        except ObjectDoesNotExist:
            return _("The descriptor value must exists")

        return None

    def check(self, descriptor_type_format):
        schema = {
            "type": "object",
            "properties": {
                "fields": {"type": "array", 'minLength': 1, 'maxLength': 1, 'items': [
                        {'type': 'string', 'minLength': 0, 'maxLength': 32, 'blank': True}
                    ]
                },
                "trans": {"type": "boolean"},
                "sortby_field": {"type": "string", "enum": ['code', 'ordinal', 'value0']},
                "display_fields": {"type": "string", "enum": ['value0', 'ordinal-value0']},
                "list_type": {"type": "string", "enum": ['automatic', 'dropdown', 'autocomplete']},
                "search_field": {"type": "string", "enum": ['ordinal', 'value0']},
                "range": {"type": "array", 'minLength': 2, 'maxLength': 2, 'items': [
                    {"type": "string", 'minLength': 1, 'maxLength': 9},
                    {"type": "string", 'minLength': 1, 'maxLength': 9}
                ]},
            }
        }

        try:
            validictory.validate(descriptor_type_format, schema)
        except validictory.MultipleValidationError as e:
            return str(e)

        min_range, max_range = [int(x) for x in descriptor_type_format['range']]

        # range validation
        if min_range < -127 or max_range > 127:
            return _('Range limits are [-127, 127]')

        return None


class DescriptorFormatTypeBoolean(DescriptorFormatType):
    """
    Specialisation for a boolean value.
    """

    def __init__(self):
        super().__init__()

        self.name = "boolean"
        self.group = DescriptorFormatTypeGroupSingle()
        self.verbose_name = _("Boolean")
        self.format_fields = ["type"]

    def validate(self, descriptor_type_format, value, descriptor_model_type):
        # check if the value is a boolean
        if not isinstance(value, bool):
            return _("The descriptor value must be a boolean")

        return None

    def check(self, descriptor_type_format):
        return None


class DescriptorFormatTypeNumeric(DescriptorFormatType):
    """
    Specialisation for a numeric value.
    """

    def __init__(self):
        super().__init__()

        self.name = "numeric"
        self.group = DescriptorFormatTypeGroupSingle()
        self.verbose_name = _("Numeric")
        self.format_fields = ["type", "precision", "unit", "custom_unit"]

    def validate(self, descriptor_type_format, value, descriptor_model_type):
        # check if the value is a decimal (string with digits - and .) with the according precision of decimals
        if not isinstance(value, str):
            return _("The descriptor value must be a decimal string")

        # check format
        try:
            dec = decimal.Decimal(value)
        except decimal.InvalidOperation:
            return _("The descriptor value must be a decimal")

        # and precision
        if dec.as_tuple().exponent != -int(decimal.Decimal(descriptor_type_format['precision'])):
            return _("The descriptor value must be a decimal with a precision of ") + " %s" % (
                descriptor_type_format['precision'],)

        return None

    def check(self, descriptor_type_format):
        schema = {
            "type": "object",
            "properties": {
                "unit": {"type": "string", 'minLength': 1, 'maxLength': 32},
                "custom_unit": {"type": "string", 'minLength': 0, 'maxLength': 32, 'blank': True},
                "precision": {"type": "string", 'enum': ["0.0", "1.0", "2.0", "3.0", "4.0", "5.0", "6.0", "7.0", "8.0", "9.0"]}
            }
        }

        try:
            validictory.validate(descriptor_type_format, schema)
        except validictory.MultipleValidationError as e:
            return str(e)

        # @todo "unit" must be in the allowed list

        if descriptor_type_format['unit'] != "custom" and descriptor_type_format['custom_unit'] != "":
            return _("Custom unit can only be defined is unit is set to custom (unit, custom_unit)")

        return None


class DescriptorFormatTypeNumericRange(DescriptorFormatType):
    """
    Specialisation for a ranged numeric value.
    """

    def __init__(self):
        super().__init__()

        self.name = "numeric_range"
        self.group = DescriptorFormatTypeGroupSingle()
        self.verbose_name = _("Numeric range")
        self.format_fields = ["type", "range", "precision", "unit", "custom_unit"]

    def validate(self, descriptor_type_format, value, descriptor_model_type):
        # check if the value is a decimal (string with digits - and .) with the according precision of
        # decimals and into the range min/max
        if not isinstance(value, str):
            return _("The descriptor value must be a decimal")

        # check format
        try:
            dec = decimal.Decimal(value)
        except decimal.InvalidOperation:
            return _("The descriptor value must be a decimal")

        # precision
        if dec.as_tuple().exponent != -int(decimal.Decimal(descriptor_type_format['precision'])):
            return _("The descriptor value must be a decimal with a precision of") + " %s" % (
                descriptor_type_format['precision'],)

        # and min/max
        if dec < decimal.Decimal(descriptor_type_format['range'][0]) or dec > decimal.Decimal(descriptor_type_format['range'][1]):
            if not isinstance(value, str):
                return _("The descriptor value must be a decimal between") + " %i and %i" % (
                    descriptor_type_format['range'][0], descriptor_type_format['range'][1])

        return None

    def check(self, descriptor_type_format):
        schema = {
            "type": "object",
            "properties": {
                "unit": {"type": "string", 'minLength': 1, 'maxLength': 32},
                "custom_unit": {"type": "string", 'minLength': 0, 'maxLength': 32, 'blank': True},
                "precision": {"type": "string", 'enum': ["0.0", "1.0", "2.0", "3.0", "4.0", "5.0", "6.0", "7.0", "8.0", "9.0"]},
                "range": {"type": "array", 'minLength': 2, 'maxLength': 2, 'items': [
                    {"type": "string", 'minLength': 1, 'maxLength': 99},
                    {"type": "string", 'minLength': 1, 'maxLength': 99}
                ]},
            }
        }

        try:
            validictory.validate(descriptor_type_format, schema)
        except validictory.MultipleValidationError as e:
            return str(e)

        # @todo "unit" must be in the allowed list

        if descriptor_type_format['unit'] != "custom" and descriptor_type_format['custom_unit'] != "":
            return _("Custom unit can only be defined is unit is set to custom (unit, custom_unit)")

        # check format
        try:
            range_min = decimal.Decimal(descriptor_type_format["range"][0])
        except decimal.InvalidOperation:
            return _("Range min must be a decimal")

        # check format
        try:
            range_max = decimal.Decimal(descriptor_type_format["range"][1])
        except decimal.InvalidOperation:
            return _("Range min must be a decimal")

        if range_min > range_max:
            return _("Range min must be lesser than range max")

        return None


class DescriptorFormatTypeOrdinal(DescriptorFormatType):
    """
    Specialisation for an ordinal value.
    """

    def __init__(self):
        super().__init__()

        self.name = "ordinal"
        self.group = DescriptorFormatTypeGroupSingle()
        self.verbose_name = _("Ordinal")
        self.format_fields = ["type", "range", "unit", "custom_unit"]

    def validate(self, descriptor_type_format, value, descriptor_model_type):
        # check if the value is an integer into the range min/max
        if not isinstance(value, int):
            return _("The descriptor value must be an integer")

        # check min/max
        if value < int(descriptor_type_format['range'][0]) or value > int(descriptor_type_format['range'][1]):
            return _("The descriptor value must be an integer between ") + " %i and %i" % (
                descriptor_type_format['range'][0], descriptor_type_format['range'][1])

        return None

    def check(self, descriptor_type_format):
        schema = {
            "type": "object",
            "properties": {
                "unit": {"type": "string", 'minLength': 1, 'maxLength': 32},
                "custom_unit": {"type": "string", 'minLength': 0, 'maxLength': 32, 'blank': True},
                "range": {"type": "array", 'minLength': 2, 'maxLength': 2, 'items': [
                    {"type": "string", 'minLength': 1, 'maxLength': 99},
                    {"type": "string", 'minLength': 1, 'maxLength': 99}
                ]},
            }
        }

        try:
            validictory.validate(descriptor_type_format, schema)
        except validictory.MultipleValidationError as e:
            return str(e)

        # @todo "unit" must be in the allowed list

        if descriptor_type_format['unit'] != "custom" and descriptor_type_format['custom_unit'] != "":
            return _("Custom unit can only be defined is unit is set to custom (unit, custom_unit)")

        # check format
        try:
            range_min = int(descriptor_type_format["range"][0])
        except decimal.InvalidOperation:
            return _("Range min must be an integer")

        # check format
        try:
            range_max = int(descriptor_type_format["range"][1])
        except decimal.InvalidOperation:
            return _("Range min must be an integer")

        if range_min > range_max:
            return _("Range min must be lesser than range max")

        return None


class DescriptorFormatTypeGPSCoordinate(DescriptorFormatType):
    """
    Specialisation for a GPS coordinate value.
    """

    def __init__(self):
        super().__init__()

        self.name = "gps"
        self.group = DescriptorFormatTypeGroupSingle()
        self.verbose_name = _("GPS coordinate")
        self.format_fields = [
            # @todo
        ]

    def validate(self, descriptor_type_format, value, descriptor_model_type):
        # @todo
        return None

    def check(self, descriptor_type_format):
        # @todo
        return None


class DescriptorFormatTypeString(DescriptorFormatType):
    """
    Specialisation for a text value.
    """

    def __init__(self):
        super().__init__()

        self.name = "string"
        self.group = DescriptorFormatTypeGroupSingle()
        self.verbose_name = _("Text")
        self.format_fields = [
            "regexp"
        ]

    def validate(self, descriptor_type_format, value, descriptor_model_type):
        # check if the value is a string matching the regexp and the max length of 1024 characters
        if not isinstance(value, str):
            return _("The descriptor value must be a string")

        # test max length
        if len(value) > 1024:
            return _("The descriptor value must be a string with a maximum length of 1024 characters")

        # test regexp
        if "regexp" in descriptor_type_format and descriptor_type_format['regexp']:
            str_re = re.compile(descriptor_type_format['regexp'])
            if str_re.match(value) is None:
                return _("The descriptor value must be a string matching the defined format")

        return None

    def check(self, descriptor_type_format):
        schema = {
            "type": "object",
            "properties": {
                "regexp": {"type": "string", 'minLength': 0, 'maxLength': 256, 'blank': True}
            }
        }

        try:
            validictory.validate(descriptor_type_format, schema)
        except validictory.MultipleValidationError as e:
            return str(e)

        # validate the regexp
        try:
            re.compile(descriptor_type_format["regexp"])
        except Exception as e:
            return str(e)

        return None


class DescriptorFormatTypeDate(DescriptorFormatType):
    """
    Specialisation for a date value.
    """

    # YYYYMMDD date format
    DATE_RE = re.compile(r'^(\d{4})([01]\d)([0-3]\d)$')

    def __init__(self):
        super().__init__()

        self.name = "date"
        self.group = DescriptorFormatTypeGroupSingle()
        self.verbose_name = _("Date")

    def validate(self, descriptor_type_format, value, descriptor_model_type):
        # check if the value is a YYYYMMDD date
        if not isinstance(value, str) or DescriptorFormatTypeDate.DATE_RE.match(value) is None:
            return _("The descriptor value must be a date string (YYYYMMDD)")

        return None

    def check(self, descriptor_type_format):
        return None


class DescriptorFormatTypeTime(DescriptorFormatType):
    """
    Specialisation for a time value.
    """

    # HH:MM:SS time format
    TIME_RE = re.compile(r'^([0-2]\d):([0-5]\d):([0-5]\d)$')

    def __init__(self):
        super().__init__()

        self.name = "time"
        self.group = DescriptorFormatTypeGroupSingle()
        self.verbose_name = pgettext_lazy("concept", "Time")

    def validate(self, descriptor_type_format, value, descriptor_model_type):
        # check if the value is a HH:MM:SS time
        if not isinstance(value, str) or DescriptorFormatTypeTime.TIME_RE.match(value) is None:
            return _("The descriptor value must be a time string (HH:MM:SS)")

        return None

    def check(self, descriptor_type_format):
        return None


class DescriptorFormatTypeDateTime(DescriptorFormatType):
    """
    Specialisation for a datetime value.
    """

    # ISO 8601 date time extended format with seconds
    DATETIME_RE = re.compile(r'^\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z)$')

    def __init__(self):
        super().__init__()

        self.name = "datetime"
        self.group = DescriptorFormatTypeGroupSingle()
        self.verbose_name = _("Date+time")

    def validate(self, descriptor_type_format, value, descriptor_model_type):
        # check if the value is an ISO and UTC (convert to UTC if necessary)
        if not isinstance(value, str) or DescriptorFormatTypeDateTime.DATETIME_RE.match(value) is None:
            return _("The descriptor value must be a datetime string (ISO 8601)")

        return None

    def check(self, descriptor_type_format):
        return None


class DescriptorFormatTypeEntity(DescriptorFormatType):
    """
    Specialisation for a referred entity value.
    """

    def __init__(self):
        super().__init__()

        self.name = "entity"
        self.group = DescriptorFormatTypeGroupSingle()
        self.verbose_name = _("Entity")

    def validate(self, descriptor_type_format, value, descriptor_model_type):
        # check if the value is an integer and if the related entity exists
        if not isinstance(value, int):
            return _("The descriptor value must be an integer")

        # check if the entity exists
        try:
            app_label, model = descriptor_type_format['model'].split('.')
            content_type = get_object_or_404(ContentType, app_label=app_label, model=model)
            content_type.get_object_for_this_type(id=value)
        except ObjectDoesNotExist:
            return _("The descriptor value must refers to an existing entity")

        return None

    def check(self, descriptor_type_format):
        schema = {
            "type": "object",
            "properties": {
                "model": {"type": "string", 'minLength': 3, 'maxLength': 256}
            }
        }

        try:
            validictory.validate(descriptor_type_format, schema)
        except validictory.MultipleValidationError as e:
            return str(e)

        entity_list = []

        from django.apps import apps
        for entity in apps.get_app_config('descriptor').describable_entities:
            entity_list.append("%s.%s" % (entity._meta.app_label, entity._meta.model_name))

        if descriptor_type_format['model'] not in entity_list:
            return _("Invalid describable entity model type name")

        return None
