# -*- coding: utf-8; -*-
#
# Copyright (c) 2017 INRA UMR1095 GDEC

"""
coll-gate geolocation interface
"""

class GeolocationInterface(object):

    def format_type_validator(self, value):
        return True

    def get_countries(self, cursor, limit, lang, term=None):
        return None

    def get_country(self, id, lang):
        return None

    def get_cities(self, cursor, limit, lang, term=None):
        return None

    def get_city(self, id, lang):
        return None

    def __str__(self):
        return 'Geolocation Interface'