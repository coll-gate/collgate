# -*- coding: utf-8; -*-
#
# @file test_geonames_model.py
# @brief 
# @author Medhi BOULNEMOUR (INRA UMR1095)
# @date 2017-04-04
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details

from django.test import TestCase
from django.utils import timezone

from geonames.models import *


class TestGeonamesModel(TestCase):
    def setUp(self):
        france = Country.objects.create(
            geoname_id=3017382,
            name='France',
            code2='FR',
            code3='FRA',
            continent='EU',
            phone='06'
        )

        City.objects.create(
            name='Paris',
            geoname_id=2988507,
            country_id=france.id,
            population=2138551,
            feature_code='PPLC'
        )

        AlternateName.objects.create(
            alt_name_id=65894,
            language='es',
            alternate_name='Francia',
            is_preferred_name=True,
            is_short_name=True,
            content_object=france
        )

        State.objects.create(
            source='bla/bla/bla/text/source.txt',
            last_modified=timezone.localtime(timezone.make_aware(timezone.datetime(1992, 5, 20))),
            size=254
        )

    def test_country_display(self):
        france = Country.objects.get(geoname_id=3017382)
        self.assertEqual(str(france), '3017382 France')

    def test_city_display(self):
        paris = City.objects.get(geoname_id=2988507)
        self.assertEqual(str(paris), '2988507 Paris')

    def test_translation_display(self):
        alt_name = AlternateName.objects.get(language='es', alternate_name='Francia')
        self.assertEqual(str(alt_name), '(65894 -> es, Francia, preferred : True, short : True)')

    def test_state(self):
        state = State.objects.get(source='bla/bla/bla/text/source.txt')
        self.assertEqual(state.last_modified, timezone.localtime(timezone.make_aware(timezone.datetime(1992, 5, 20))))
        self.assertEqual(state.size, 254)

