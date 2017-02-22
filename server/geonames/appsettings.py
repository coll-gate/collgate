# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
Coll-gate geonames settings
"""

import os.path
from django.conf import settings

# Default settings of the application
APP_DB_DEFAULT_SETTINGS = {
}

APP_VERBOSE_NAME = "Coll-Gate :: Geolocation"

APP_SETTINGS_MODEL = 'main.models.Settings'

# defines the string to build the path of the 4xx, 5xx templates
HTTP_TEMPLATE_STRING = "main/%s.html"  # lookup into the main module

APP_VERSION = (0, 1, 0)


COUNTRY_SOURCES = getattr(settings, 'GEONAMES_COUNTRY_SOURCES',
    ['http://download.geonames.org/export/dump/countryInfo.txt'])
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
    'GEONAMES_INCLUDE_CITY_TYPES',
    ['PPL', 'PPLA', 'PPLA2', 'PPLA3', 'PPLA4', 'PPLC',
     'PPLF', 'PPLG', 'PPLL', 'PPLR', 'PPLS', 'STLMT']
)

class ICountry:
    """
    Country field indexes in geonames.
    """
    code = 0
    code3 = 1
    codeNum = 2
    fips = 3
    name = 4
    capital = 5
    area = 6
    population = 7
    continent = 8
    tld = 9
    currencyCode = 10
    currencyName = 11
    phone = 12
    postalCodeFormat = 13
    postalCodeRegex = 14
    languages = 15
    geonameid = 16
    neighbours = 17
    equivalentFips = 18

class IRegion:
    """
    Region field indexes in geonames.
    """
    code = 0
    name = 1
    asciiName = 2
    geonameid = 3


class IGeoname:
    """
    City field indexes in geonames.
    Description of fields: http://download.geonames.org/export/dump/readme.txt
    """
    geonameid = 0
    name = 1
    asciiName = 2
    alternateNames = 3
    latitude = 4
    longitude = 5
    featureClass = 6
    featureCode = 7
    countryCode = 8
    cc2 = 9
    admin1Code = 10
    admin2Code = 11
    admin3Code = 12
    admin4Code = 13
    population = 14
    elevation = 15
    gtopo30 = 16
    timezone = 17
    modificationDate = 18


class IAlternate:
    """
    Alternate names field indexes in geonames.
    Description of fields: http://download.geonames.org/export/dump/readme.txt
    """
    nameid = 0
    geonameid = 1
    language = 2
    name = 3
    isPreferred = 4
    isShort = 5
    isColloquial = 6
    isHistoric = 7