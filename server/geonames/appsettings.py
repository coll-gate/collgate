# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
Coll-gate geonames settings
"""

import os.path
from django.conf import settings

# Default settings of the application
# APP_DB_DEFAULT_SETTINGS = {
#     'country_source': '"' + getattr(settings, 'GEONAMES_COUNTRY_SOURCES', ['http://download.geonames.org/export/dump/countryInfo.txt']) + '"',
#     'data_dir': '"' + getattr(settings, 'GEONAMES_DATA_DIR', os.path.normpath(os.path.join(os.path.dirname(os.path.realpath(__file__)), 'data'))) + '"'
# }

APP_VERBOSE_NAME = "Coll-Gate :: Geolocation"

APP_SETTINGS_MODEL = 'main.models.Settings'

# defines the string to build the path of the 4xx, 5xx templates
HTTP_TEMPLATE_STRING = "main/%s.html"  # lookup into the main module

APP_VERSION = (0, 1, 0)


COUNTRY_SOURCES = getattr(settings, 'GEONAMES_COUNTRY_SOURCES',
    ['http://download.geonames.org/export/dump/countryInfo.txt'])
REGION_SOURCES = getattr(settings, 'GEONAMES_REGION_SOURCES',
    ['http://download.geonames.org/export/dump/admin1CodesASCII.txt'])
CITY_SOURCES = getattr(settings, 'GEONAMES_CITY_SOURCES',
    ['http://download.geonames.org/export/dump/cities15000.zip'])
TRANSLATION_SOURCES = getattr(settings, 'GEONAMES_TRANSLATION_SOURCES',
    ['http://download.geonames.org/export/dump/alternateNames.zip'])
TRANSLATION_LANGUAGES = getattr(settings, 'GEONAMES_TRANSLATION_LANGUAGES',
    ['en', 'fr'])

DATA_DIR = getattr(settings, 'GEONAMES_DATA_DIR',
    os.path.normpath(os.path.join(os.path.dirname(os.path.realpath(__file__)), 'data')))

INCLUDE_CITY_TYPES = getattr(
    settings,
    'CITIES_LIGHT_INCLUDE_CITY_TYPES',
    ['PPL', 'PPLA', 'PPLA2', 'PPLA3', 'PPLA4', 'PPLC',
     'PPLF', 'PPLG', 'PPLL', 'PPLR', 'PPLS', 'STLMT']
)