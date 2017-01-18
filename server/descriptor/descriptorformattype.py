# -*- coding: utf-8; -*-
#
# Copyright (c) 2017 INRA UMR1095 GDEC

"""
coll-gate descriptor format type class
"""

import re
import decimal

from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ObjectDoesNotExist
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
        # i18n error message
        self.error = None

        # name referred as a code, stored in format.type.
        self.name = ''

        # related group as string in way to organise type into a select view.
        self.group = None

        # i18n verbose name displayable for the client
        self.verbose_name = ''

        # list of related field into format.*.
        self.format_fields = []

    def validate(self, descriptor_type_format, value, descriptor_model_type):
        """
        Validate the value according the format. self.error contains the details of the error if False is returned.
        :param descriptor_type_format: Format of the related type of descriptor
        :param value: Value to validate
        :param descriptor_model_type: related descriptor model type
        :return: True if the validation is done
        """
        return True


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
            # @todo
        ]

    def validate(self, descriptor_type_format, value, descriptor_model_type):
        # check if the value is a string and exists into the type of descriptor
        if not isinstance(value, str):
            self.error = _("The descriptor value must be a string")
            return False

        # check if the value exists
        try:
            descriptor_model_type.descriptor_type.get_value(value)
        except ObjectDoesNotExist:
            self.error = _("The descriptor value must exists")
            return False

        return True


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
            # @todo
        ]

    def validate(self, descriptor_type_format, value, descriptor_model_type):
        # check if the value is a string and exists into the type of descriptor
        if not isinstance(value, str):
            self.error = _("The descriptor value must be a string")
            return False

        # check if the value exists
        try:
            descriptor_model_type.descriptor_type.get_value(value)
        except ObjectDoesNotExist:
            self.error = _("The descriptor value must exists")
            return False

        return True


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
            # @todo
        ]

    def validate(self, descriptor_type_format, value, descriptor_model_type):
        # check if the value is a string and exists into the type of descriptor
        if not isinstance(value, str):
            self.error = _("The descriptor value must be a string")
            return False

        # check if the value exists
        try:
            descriptor_model_type.descriptor_type.get_value(value)
        except ObjectDoesNotExist:
            self.error = _("The descriptor value must exists")
            return False

        return True


class DescriptorFormatTypeBoolean(DescriptorFormatType):
    """
    Specialisation for a boolean value.
    """

    def __init__(self):
        super().__init__()

        self.name = "boolean"
        self.group = DescriptorFormatTypeGroupSingle()
        self.verbose_name = _("Boolean")

    def validate(self, descriptor_type_format, value, descriptor_model_type):
        # check if the value is a boolean
        if not isinstance(value, bool):
            self.error = _("The descriptor value must be a boolean")
            return False

        return True


class DescriptorFormatTypeNumeric(DescriptorFormatType):
    """
    Specialisation for a numeric value.
    """

    def __init__(self):
        super().__init__()

        self.name = "numeric"
        self.group = DescriptorFormatTypeGroupSingle()
        self.verbose_name = _("Numeric")
        self.format_fields = [
            "precision"
        ]

    def validate(self, descriptor_type_format, value, descriptor_model_type):
        # check if the value is a decimal (string with digits - and .) with the according precision of decimals
        if not isinstance(value, str):
            self.error = _("The descriptor value must be a decimal string")
            return False

        # check format
        try:
            dec = decimal.Decimal(value)
        except decimal.InvalidOperation:
            self.error = _("The descriptor value must be a decimal")
            return False

        # and precision
        if dec.as_tuple().exponent != -int(decimal.Decimal(descriptor_type_format['precision'])):
            self.error = _("The descriptor value must be a decimal with a precision of ") + " %s" % (
                descriptor_type_format['precision'],)
            return False

        return True


class DescriptorFormatTypeNumericRange(DescriptorFormatType):
    """
    Specialisation for a ranged numeric value.
    """

    def __init__(self):
        super().__init__()

        self.name = "numeric_range"
        self.group = DescriptorFormatTypeGroupSingle()
        self.verbose_name = _("Numeric range")
        self.format_fields = [
            "precision",
            "range",
        ]

    def validate(self, descriptor_type_format, value, descriptor_model_type):
        # check if the value is a decimal (string with digits - and .) with the according precision of
        # decimals and into the range min/max
        if not isinstance(value, str):
            self.error = _("The descriptor value must be a decimal")
            return False

        # check format
        try:
            dec = decimal.Decimal(value)
        except decimal.InvalidOperation:
            self.error = _("The descriptor value must be a decimal")
            return False

        # precision
        if dec.as_tuple().exponent != -int(decimal.Decimal(descriptor_type_format['precision'])):
            self.error = _("The descriptor value must be a decimal with a precision of") + " %s" % (
                descriptor_type_format['precision'],)
            return False

        # and min/max
        if dec < decimal.Decimal(descriptor_type_format['range'][0]) or dec > decimal.Decimal(descriptor_type_format['range'][1]):
            if not isinstance(value, str):
                self.error = _("The descriptor value must be a decimal between") + " %i and %i" % (
                    descriptor_type_format['range'][0], descriptor_type_format['range'][1])
                return False

        return True


class DescriptorFormatTypeOrdinal(DescriptorFormatType):
    """
    Specialisation for an ordinal value.
    """

    def __init__(self):
        super().__init__()

        self.name = "ordinal"
        self.group = DescriptorFormatTypeGroupSingle()
        self.verbose_name = _("Ordinal")
        self.format_fields = [
            "range",
        ]

    def validate(self, descriptor_type_format, value, descriptor_model_type):
        # check if the value is an integer into the range min/max
        if not isinstance(value, int):
            self.error = _("The descriptor value must be an integer")
            return False

        # check min/max
        if value < int(descriptor_type_format['range'][0]) or value > int(descriptor_type_format['range'][1]):
            self.error = _("The descriptor value must be an integer between ") + " %i and %i" % (
                descriptor_type_format['range'][0], descriptor_type_format['range'][1])
            return False

        return True


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
        return True


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
            self.error = _("The descriptor value must be a string")
            return False

        # test max length
        if len(value) > 1024:
            self.error = _("The descriptor value must be a string with a maximum length of 1024 characters")
            return False

        # test regexp
        if "regexp" in descriptor_type_format and descriptor_type_format['regexp']:
            str_re = re.compile(descriptor_type_format['regexp'])
            if str_re.match(value) is None:
                self.error =  _("The descriptor value must be a string matching the defined format")
                return False

        return True


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
            self.error = _("The descriptor value must be a date string (YYYYMMDD)")
            return False

        return True


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
            self.error = _("The descriptor value must be a time string (HH:MM:SS)")
            return False

        return True


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
            self.error = _("The descriptor value must be a datetime string (ISO 8601)")
            return False

        return True


class DescriptorFormatTypeEntity(DescriptorFormatType):
    """
    Specialisation for a refered entity value.
    """

    def __init__(self):
        super().__init__()

        self.name = "entity"
        self.group = DescriptorFormatTypeGroupSingle()
        self.verbose_name = _("Entity")

    def validate(self, descriptor_type_format, value, descriptor_model_type):
        # check if the value is an integer and if the related entity exists
        if not isinstance(value, int):
            self.error = _("The descriptor value must be an integer")
            return False

        # check if the entity exists
        try:
            app_label, model = descriptor_type_format['model'].split('.')
            content_type = get_object_or_404(ContentType, app_label=app_label, model=model)
            content_type.get_object_for_this_type(id=value)
        except ObjectDoesNotExist:
            self.error = _("The descriptor value must refers to an existing entity")
            return False

        return True
