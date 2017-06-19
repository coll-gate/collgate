# -*- coding: utf-8; -*-
#
# @file descriptorformattype.py
# @brief coll-gate descriptor format type class for geolocation
# @author Medhi BOULNEMOUR (INRA UMR1095)
# @date 2017-01-03
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

import validictory
from django.utils import translation
from django.utils.translation import ugettext_lazy as _

from descriptor.descriptorformattype import DescriptorFormatTypeGroup, DescriptorFormatType
from geolocation import instance


class DescriptorFormatTypeGroupGeolocation(DescriptorFormatTypeGroup):
    """
    Group of geolocation descriptors.
    """

    def __init__(self):
        super().__init__("geolocation", _("Geolocation"))


# class DescriptorFormatTypeGeolocation(DescriptorFormatType):
#     """
#     Specialisation for a geolocation value.
#     """
#
#     def __init__(self):
#         super().__init__()
#
#         self.name = "geolocation"
#         self.group = DescriptorFormatTypeGroupGeolocation()
#         self.verbose_name = _("Geolocation")
#         self.format_fields = [
#             "lat",
#             "long",
#             "city",
#             "region",
#             "country",
#         ]
#         self.value_is_code = True
#
#     def validate(self, descriptor_type_format, value, descriptor_model_type):
#         return instance.geolocation_app.geolocation_manager.format_type_validator(value)
#
#     def check(self, descriptor_type_format):
#         schema = {
#             "type": "object",
#             "properties": {
#                 "lat": {"type": "number", "required": False, "dependencies": "long"},
#                 "long": {"type": "number", "required": False, "dependencies": "lat"},
#                 "city": {"type": "string", "required": False},
#                 "region": {"type": "string", "required": False},
#                 "country": {"type": "string", "required": False}
#             }
#         }
#
#         try:
#             validictory.validate(descriptor_type_format, schema)
#         except validictory.MultipleValidationError as e:
#             return str(e)
#
#         return None


class DescriptorFormatTypeCountry(DescriptorFormatType):
    """
    Specialisation for a country value.
    """

    def __init__(self):
        super().__init__()

        self.name = "country"
        self.group = DescriptorFormatTypeGroupGeolocation()
        self.verbose_name = _("Country")
        self.format_fields = [
            "country"
        ]
        self.data = "INTEGER"

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

    def get_display_values_for(self, descriptor_type, descriptor_type_format, values, limit):
        items = {}

        # search for the countries
        lang = translation.get_language()
        countries = instance.geolocation_app.geolocation_manager.get_country_list(values, limit, lang)

        for country in countries:
            if country['preferred_names']:
                display = country['preferred_names']
            elif country['short_names']:
                display = country['short_names']
            elif country['alt_names']:
                display = country['alt_names']
            else:
                display = country['name']

            items[country['cou_id']] = display

        return {
            'cacheable': True,
            'items': items
        }

    def related_model(self, descriptor_type_format):
        from geonames.models import Country
        return Country


class DescriptorFormatTypeCity(DescriptorFormatType):
    """
    Specialisation for a city value.
    """

    def __init__(self):
        super().__init__()

        self.name = "city"
        self.group = DescriptorFormatTypeGroupGeolocation()
        self.verbose_name = _("City")
        self.format_fields = [
            "city"
        ]
        self.data = "INTEGER"

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

    def get_display_values_for(self, descriptor_type, descriptor_type_format, values, limit):
        items = {}

        # search for the cities
        lang = translation.get_language()
        cities = instance.geolocation_app.geolocation_manager.get_city_list(values, limit, lang)

        for city in cities:
            if city['preferred_names']:
                display = city['preferred_names']
            elif city['short_names']:
                display = city['short_names']
            elif city['alt_names']:
                display = city['alt_names']
            else:
                display = city['name']

            if city['country']['preferred_names']:
                display += ', ' + city['country']['preferred_names']
            elif city['country']['short_names']:
                display += ', ' + city['country']['short_names']
            elif city['country']['alt_names']:
                display += ', ' + city['country']['alt_names']
            else:
                display += ', ' + city['country']['name']

            items[city['cit_id']] = display

        return {
            'cacheable': True,
            'items': items
        }

    def related_model(self, descriptor_type_format):
        from geonames.models import City
        return City
