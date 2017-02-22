# -*- coding: utf-8; -*-
#
# Copyright (c) 2017 INRA UMR1095 GDEC

"""
coll-gate geolocation manager for cities light
"""

from django.db.models import Q
from geolocation.geolocationinterface import GeolocationInterface
from geonames.models import Country, City

class GeolocationManager(GeolocationInterface):

    def format_type_validator(self, value):
        # todo
        return True

    def get_countries(self, cursor, limit, lang, term=None):

        if cursor:
            qs = Country.objects.filter(Q(name__gt=cursor.name))
        else:
            qs = Country.objects.all()

        if term is not None:
           qs = qs.filter(Q(name__icontains=term))

        tqs = qs.order_by('name', 'id')[:limit]

        results= []
        for country in tqs:
            alt_name = []
            for name in country.alt_names.filter(language=lang):
                alt_name.append(name.alternate_name)

            result = {
                'cou_id'     : country.pk,
                'geoname_id' : country.geoname_id,
                'name'       : country.name,
                'code2'      : country.code2,
                'code3'      : country.code3,
                'lat'        : country.latitude,
                'long'       : country.longitude,
                'alt_name'   : ','.join(alt_name)
            }
            results.append(result)

        return results

    def get_country(self, id, lang):

        c = Country.objects.get(id=id)
        alt_name = []
        for name in c.alt_names.filter(language=lang):
            alt_name.append(name.alternate_name)

        result = {
            'cou_id'     : c.pk,
            'geoname_id' : c.geoname_id,
            'name'       : c.name,
            'code2'      : c.code2,
            'code3'      : c.code3,
            'lat'        : c.latitude,
            'long'       : c.longitude,
            'alt_name'   : ','.join(alt_name)
        }

        return result

    def get_cities(self, cursor, limit, lang, term=None):

        if cursor:
            qs = City.objects.filter(Q(name__gt=cursor.name))
        else:
            qs = City.objects.all()

        if term is not None:
            qs = qs.filter(Q(name__icontains=term))

        tqs = qs.order_by('name', 'id')[:limit]

        results= []
        for city in tqs:
            alt_name = []
            for name in city.alt_names.filter(language=lang):
                alt_name.append(name.alternate_name)

            result = {
                'cit_id'     : city.pk,
                'geoname_id' : city.geoname_id,
                'name'       : city.name,
                'lat'        : city.latitude,
                'long'       : city.longitude,
                'alt_name'   : ','.join(alt_name),
                'cou_id' : city.country_id
            }
            results.append(result)

        return results

    def get_city(self, id, lang):

        c = City.objects.get(id=id)
        alt_name = []
        for name in c.alt_names.filter(language=lang):
            alt_name.append(name.alternate_name)

        result = {
            'cit_id'     : c.pk,
            'geoname_id' : c.geoname_id,
            'name'       : c.name,
            'lat'        : c.latitude,
            'long'       : c.longitude,
            'alt_name'   : ','.join(alt_name),
            'cou_id' : c.country_id
        }

        return result