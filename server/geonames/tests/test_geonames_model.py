from django.test import TestCase
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

        alt_name = AlternateName.objects.create(
            language='es',
            alternate_name='Francia',
            is_preferred_name=True,
            is_short_name=True
        )

        france.alt_names.add(alt_name)

    def test_country_display(self):
        france = Country.objects.get(geoname_id=3017382)
        self.assertEqual(str(france), '3017382 France')

    def test_city_display(self):
        paris = City.objects.get(geoname_id=2988507)
        self.assertEqual(str(paris), '2988507 Paris')

    def test_translation_display(self):
        alt_name = AlternateName.objects.get(language='es', alternate_name='Francia')
        self.assertEqual(str(alt_name), '(es, Francia, preferred : True, short : True)')
