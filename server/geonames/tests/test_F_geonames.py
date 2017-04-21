# -*- coding: utf-8; -*-
#
# Copyright (c) 2017 INRA UMR1095 GDEC

"""
coll-gate geolocation module functional tests.
"""

from unittest import TestCase
from ..appsettings import DATA_DIR
from urllib import request
import os
from geonames.geonames import Geonames
from django.utils import timezone


class TestGeonames(TestCase):

    def test_access_to_destination_folder(self):
        """
        Application should be able to write to DATA_DIR path 
        """
        result = os.access(DATA_DIR, os.W_OK)
        self.assertTrue(result)

    def test_connection_to_country_source(self):
        """
        Test the connection to a country source
        """
        result = request.urlopen(url="http://download.geonames.org/export/dump/countryInfo.txt", timeout=10)
        if result.getcode() is not 200:
            self.fail()

    def test_connection_to_city_source(self):
        """
        Test the connection to a city source
        """
        result = request.urlopen(url="http://download.geonames.org/export/dump/cities15000.zip", timeout=10)
        if result.getcode() is not 200:
            self.fail()

    def test_connection_to_translation_source(self):
        """
        Test the connection to a translation source
        """
        result = request.urlopen(url="http://download.geonames.org/export/dump/alternateNames.zip", timeout=10)
        if result.getcode() is not 200:
            self.fail()
