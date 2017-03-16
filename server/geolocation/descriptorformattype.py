# -*- coding: utf-8; -*-
#
# Copyright (c) 2017 INRA UMR1095 GDEC

"""
coll-gate descriptor format type class for geolocation
"""
import validictory
from django.utils.translation import ugettext_lazy as _

from descriptor.descriptorformattype import DescriptorFormatTypeGroup, DescriptorFormatType
from geolocation import instance

class DescriptorFormatTypeGroupGeolocation(DescriptorFormatTypeGroup):
    """
    Group of geolocation descriptors.
    """

    def __init__(self):
        super().__init__("geolocation", _("Geolocation"))


class DescriptorFormatTypeGeolocation(DescriptorFormatType):
    """
    Specialisation for a geolocation value.
    """

    def __init__(self) -> object:
        super().__init__()

        self.name = "geolocation"
        self.group = DescriptorFormatTypeGroupGeolocation()
        self.verbose_name = _("Geolocation")
        self.format_fields = [
            "lat",
            "long",
            "city",
            "region",
            "country",
        ]


    def validate(self, descriptor_type_format, value, descriptor_model_type):
        return instance.geolocation_app.geolocation_manager.format_type_validator(value)

    def check(self, descriptor_type_format):
        schema = {
            "type": "object",
            "properties": {
                "lat": {"type": "number", "required": False, "dependencies": "long"},
                "long": {"type": "number", "required": False, "dependencies": "lat"},
                "city": {"type": "string", "required": False},
                "region": {"type": "string", "required": False},
                "country": {"type": "string", "required": False}
            }
        }

        try:
            validictory.validate(descriptor_type_format, schema)
        except validictory.MultipleValidationError as e:
            return str(e)

        return None

class DescriptorFormatTypeCountry(DescriptorFormatType):
    """
    Specialisation for a country value.
    """

    def __init__(self) -> object:
        super().__init__()

        self.name = "country"
        self.group = DescriptorFormatTypeGroupGeolocation()
        self.verbose_name = _("Country")
        self.format_fields = [
            "country"
        ]


    def validate(self, descriptor_type_format, value, descriptor_model_type):
        return instance.geolocation_app.geolocation_manager.country_format_type_validator(value)

    def check(self, descriptor_type_format):
        schema = {
            "type": "object",
            "properties": {
                "country": {"type": "string", "required": False}
            }
        }

        try:
            validictory.validate(descriptor_type_format, schema)
        except validictory.MultipleValidationError as e:
            return str(e)

        return None

class DescriptorFormatTypeCity(DescriptorFormatType):
    """
    Specialisation for a city value.
    """

    def __init__(self) -> object:
        super().__init__()

        self.name = "city"
        self.group = DescriptorFormatTypeGroupGeolocation()
        self.verbose_name = _("City")
        self.format_fields = [
            "city"
        ]


    def validate(self, descriptor_type_format, value, descriptor_model_type):
        return instance.geolocation_app.geolocation_manager.city_format_type_validator(value)

    def check(self, descriptor_type_format):
        schema = {
            "type": "object",
            "properties": {
                "city": {"type": "string", "required": False}
            }
        }

        try:
            validictory.validate(descriptor_type_format, schema)
        except validictory.MultipleValidationError as e:
            return str(e)

        return None