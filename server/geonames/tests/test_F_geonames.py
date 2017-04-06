# -*- coding: utf-8; -*-
#
# Copyright (c) 2017 INRA UMR1095 GDEC

"""
coll-gate geolocation module functional tests.
"""

from unittest import TestCase
from ..appsettings import DATA_DIR, COUNTRY_SOURCES, CITY_SOURCES, TRANSLATION_SOURCES
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

    def test_connection_to_country_sources(self):
        """
        Test the connection to the country sources
        """
        for source in COUNTRY_SOURCES:
            result = request.urlopen(url=source, timeout=10)
            if result.getcode() is not 200:
                self.fail()

    def test_connection_to_city_sources(self):
        """
        Test the connection to the city sources
        """
        for source in CITY_SOURCES:
            result = request.urlopen(url=source, timeout=10)
            if result.getcode() is not 200:
                self.fail()

    def test_connection_to_translation_sources(self):
        """
        Test the connection to the translation sources
        """
        for source in TRANSLATION_SOURCES:
            result = request.urlopen(url=source, timeout=10)
            if result.getcode() is not 200:
                self.fail()

    def test_download(self):
        """
        Geonames module should be able to download source  
        """
        source = CITY_SOURCES[0]
        destination_file_name = source.split('/')[-1]
        file_path = os.path.join(DATA_DIR, destination_file_name)

        src_size, src_last_modified = Geonames.download(source, file_path)
        last_modified = timezone.localtime(
            timezone.make_aware(timezone.datetime.utcfromtimestamp(os.path.getmtime(file_path)))
        )

        os.remove(file_path)

        self.assertGreaterEqual(src_size, 1)
        self.assertIsNotNone(src_last_modified)
        self.assertTrue(timezone.is_aware(last_modified))
