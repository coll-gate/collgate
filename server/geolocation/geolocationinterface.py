# -*- coding: utf-8; -*-
#
# Copyright (c) 2017 INRA UMR1095 GDEC

"""
coll-gate geolocation interface
"""

class GeolocationInterface(object):

    def geolocation_format_type_validator(self, value):
        return None

    def country_format_type_validator(self, value):
        return None

    def city_format_type_validator(self, value):
        return None

    def search_cities_online(self, limit, lang, term=None):
        return None

    def get_countries(self, cursor, limit, lang, term=None):
        return None

    def get_country(self, id, lang):
        return None

    def get_cities(self, cursor, limit, lang, term=None):
        return None

    def get_city(self, id, lang):
        return None

    def create_city(self, external_id, lang):
        return None

    def __str__(self):
        return 'Geolocation Interface'