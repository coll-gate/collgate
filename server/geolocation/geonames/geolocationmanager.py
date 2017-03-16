# -*- coding: utf-8; -*-
#
# Copyright (c) 2017 INRA UMR1095 GDEC

"""
coll-gate geolocation manager for cities light
"""

from django.db.models import Q
from geolocation.geolocationinterface import GeolocationInterface
from geonames.models import Country, City, AlternateName
from geonames.appsettings import USERNAME, INCLUDE_CITY_TYPES, TRANSLATION_LANGUAGES
from urllib.request import urlopen
from urllib.parse import urlencode
import json
from django.core.exceptions import SuspiciousOperation
from django.utils.translation import ugettext_lazy as _
from igdectk.rest.handler import *
from django.db import transaction

class GeolocationManager(GeolocationInterface):

    def __init__(self):
        self.geonames_username = USERNAME
        self.geonames_url = 'http://api.geonames.org/'

    def country_format_type_validator(self, value):

        if Country.objects.get(id=value):
            return None
        return _('the descriptor value must be a referenced country')

    def city_format_type_validator(self, value):

        if City.objects.get(id=value):
            return None
        return _('the descriptor value must be a referenced city')

    def search_cities_online(self, limit, lang, term=None):

        url = self.geonames_url + 'searchJSON'
        values = {
            'maxRow': limit,
            'lang': lang,
            'FeatureClass': 'P',
            'username': self.geonames_username,
            'style' : 'FULL'
        }

        if len(term) <=2:
            values['name_equals'] = term
        else:
            values['name_startsWith'] = term

        data = urlencode(values)
        data = data.encode('ascii')

        r = urlopen(url, data)
        data = json.loads(r.read().decode(r.info().get_param('charset') or 'utf-8'))

        results = []

        for city in data['geonames']:
            alt_name = []
            preferred = []
            short = []

            if 'alternateNames' in city:
                for name in city['alternateNames']:
                    if name['lang'] != lang:
                        continue

                    if 'isPreferredName' in name and name['isPreferredName']:
                        preferred.append(name['name'])
                    if 'isShortName' in name and name['isShortName']:
                        short.append(name['name'])
                    else:
                        alt_name.append(name['name'])

            result = {
                'geoname_id': city['geonameId'],
                'name': city['name'],
                'lat': city['lat'],
                'long': city['lng'],
                'country_geoname_id': city['countryId'],
                'country_name': city['countryName'],
                'alt_name': ','.join(alt_name),
                'preferred_name': ', '.join(preferred),
                'short_name': ', '.join(short)
            }
            results.append(result)

        return results


    def get_countries(self, cursor, limit, lang, term=None):

        if cursor:
            qs = Country.objects.filter(Q(name__gt=cursor.name))
        else:
            qs = Country.objects.all()

        if term is not None:
            qs = qs.filter(Q(alt_names__alternate_name__istartswith=term) | Q(name__istartswith=term))

        tqs = qs.distinct().order_by('name', 'id')[:limit]

        results= []
        for country in tqs:
            alt_name = []
            preferred = []
            short = []
            for name in country.alt_names.filter(language=lang):
                if name.is_preferred_name:
                    preferred.append(name.alternate_name)
                if name.is_short_name:
                    short.append(name.alternate_name)
                else:
                    alt_name.append(name.alternate_name)

            result = {
                'cou_id'     : country.pk,
                'geoname_id' : country.geoname_id,
                'name'       : country.name,
                'code2'      : country.code2,
                'code3'      : country.code3,
                'lat'        : country.latitude,
                'long'       : country.longitude,
                'alt_name'   : ', '.join(alt_name),
                'preferred_name': ', '.join(preferred),
                'short_name': ', '.join(short)
            }
            results.append(result)

        return results

    def get_country(self, id, lang):

        c = Country.objects.get(id=id)
        alt_name = []
        preferred = []
        short = []
        for name in c.alt_names.filter(language=lang):
            if name.is_preferred_name:
                preferred.append(name.alternate_name)
            if name.is_short_name:
                short.append(name.alternate_name)
            else:
                alt_name.append(name.alternate_name)

        result = {
            'cou_id'     : c.pk,
            'geoname_id' : c.geoname_id,
            'name'       : c.name,
            'code2'      : c.code2,
            'code3'      : c.code3,
            'lat'        : c.latitude,
            'long'       : c.longitude,
            'alt_name'   : ', '.join(alt_name),
            'preferred_name': ', '.join(preferred),
            'short_name': ', '.join(short)
        }

        return result

    def get_cities(self, cursor, limit, lang, term=None):

        if cursor:
            qs = City.objects.filter(Q(name__gt=cursor.name))
        else:
            qs = City.objects.all()

        if term is not None:
            if len(term) <= 2:
                qs = qs.filter(Q(alt_names__alternate_name=term) | Q(name=term))
            else:
                qs = qs.filter(Q(alt_names__alternate_name__istartswith=term) | Q(name__istartswith=term))

        tqs = qs.distinct().order_by('name', 'id')[:limit]

        results= []
        for city in tqs:
            alt_name = []
            preferred = []
            short = []
            for name in city.alt_names.filter(language=lang):
                if name.is_preferred_name:
                    preferred.append(name.alternate_name)
                if name.is_short_name:
                    short.append(name.alternate_name)
                else:
                    alt_name.append(name.alternate_name)

            result = {
                'cit_id'     : city.pk,
                'geoname_id' : city.geoname_id,
                'name'       : city.name,
                'lat'        : city.latitude,
                'long'       : city.longitude,
                'alt_name'   : ','.join(alt_name),
                'cou_id' : city.country_id,
                'preferred_name': ', '.join(preferred),
                'short_name': ', '.join(short)
            }
            results.append(result)

        return results

    def get_city(self, id, lang):

        c = City.objects.get(id=id)
        alt_name = []
        preferred = []
        short = []
        for name in c.alt_names.filter(language=lang):
            if name.is_preferred_name:
                preferred.append(name.alternate_name)
            if name.is_short_name:
                short.append(name.alternate_name)
            else:
                alt_name.append(name.alternate_name)

        result = {
            'cit_id'     : c.pk,
            'geoname_id' : c.geoname_id,
            'name'       : c.name,
            'lat'        : c.latitude,
            'long'       : c.longitude,
            'alt_name'   : ','.join(alt_name),
            'cou_id' : c.country_id,
            'preferred_name': ', '.join(preferred),
            'short_name': ', '.join(short)
        }

        return result

    @transaction.atomic
    def create_city(self, geoname_id, lang):

        url = self.geonames_url + 'getJSON'
        values = {
            'geonameId': geoname_id,
            'username': self.geonames_username,
            'style': 'FULL'
        }

        data = urlencode(values)
        data = data.encode('ascii')

        r = urlopen(url, data)
        data = json.loads(r.read().decode(r.info().get_param('charset') or 'utf-8'))


        if data['fcode'] not in INCLUDE_CITY_TYPES:
            raise SuspiciousOperation(_("The geonmes feature code is not supported"))

        try:
            country = Country.objects.get(geoname_id=int_arg(data['countryId']))
        except:
            raise SuspiciousOperation(_("The country of this city is not referenced"))

        try:
            lat = float(data['lat'])
            long = float(data['lng'])
            population = int_arg(data['population'])
        except:
            raise SuspiciousOperation(_("The geolocation data are not supported"))

        try:
            city, value = City.objects.get_or_create(
                geoname_id = int_arg(geoname_id),
                country_id = country.id,
                defaults = {
                    'name': data['name'],
                    'latitude': lat,
                    'longitude': long,
                    'population': population,
                    'feature_code': data['fcode']
                }
            )
        except:
            raise SuspiciousOperation(_("Unable to create the city"))


        if value and 'alternateNames' in data:

            for city_alt_name in data['alternateNames']:

                try:
                    if city_alt_name['lang'] not in TRANSLATION_LANGUAGES:
                        continue
                except:
                    continue

                try:
                    is_preferred = bool(city_alt_name['isPreferredName'])
                except:
                    is_preferred = False

                try:
                    is_short = bool(city_alt_name['isShortName'])
                except:
                    is_short = False

                try:
                    alt_name = AlternateName.objects.create(
                        language=city_alt_name['lang'],
                        alternate_name=city_alt_name['name'],
                        is_preferred_name=is_preferred,
                        is_short_name=is_short
                    )

                    city.alt_names.add(alt_name)

                except:
                    continue

        city = City.objects.get(id=city.id)
        alt_names = []
        preferred = []
        short = []
        for name in city.alt_names.filter(language=lang):
            if name.is_preferred_name:
                preferred.append(name.alternate_name)
            if name.is_short_name:
                short.append(name.alternate_name)
            else:
                alt_names.append(name.alternate_name)


        result = {
            'cit_id': city.id,
            'geoname_id': city.geoname_id,
            'name': city.name,
            'lat': city.latitude,
            'long': city.longitude,
            'alt_name': ','.join(alt_names),
            'cou_id': city.country_id,
            'preferred_name': ', '.join(preferred),
            'short_name': ', '.join(short)
        }

        return result