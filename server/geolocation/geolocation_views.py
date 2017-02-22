# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
coll-gate geolocation rest handler
"""

from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest

from geolocation import instance
from .base import RestGeolocation
from django.apps import apps


class Cursor(object):
    name = None
    id = None

    def __init__(self, name, id):
        self._name = name
        self._id = id

    @property
    def name(self):
        return self._name

    @property
    def id(self):
        return self._id

    @name.setter
    def name(self, value):
        self._name = value

    @id.setter
    def id(self, value):
        self._id = value

    def __str__(self):
        return '%s/%s' % (self._name, str(self._id))


class RestGeolocationCountry(RestGeolocation):
    regex = r'^country/$'
    name = 'country'


class RestGeolocationCity(RestGeolocation):
    regex = r'^city/$'
    name = 'city'


class RestGeolocationCountryId(RestGeolocationCountry):
    regex = r'^(?P<cou_id>[0-9]+)/$'
    suffix = 'id'


class RestGeolocationCityId(RestGeolocationCity):
    regex = r'^(?P<cit_id>[0-9]+)/$'
    suffix = 'id'


class RestGeolocationCountrySearch(RestGeolocationCountry):
    regex = r'^search/$'
    suffix = 'search'


class RestGeolocationCitySearch(RestGeolocationCity):
    regex = r'^search/$'
    suffix = 'search'


@RestGeolocationCountrySearch.def_request(Method.GET, Format.JSON)
def search_country(request):
    """
    Quick search for a country
    """

    term = request.GET.get('term')

    lang = request.GET.get('lang', 'en')
    results_per_page = int_arg(request.GET.get('more', 30))
    str_cursor = request.GET.get('cursor')
    limit = results_per_page

    manager = instance.geolocation_app.geolocation_manager

    if str_cursor:
        cursor_name, cursor_id = str_cursor.rsplit('/', 1)
        current_cursor = Cursor(cursor_name, int(cursor_id))
    else:
        current_cursor = None

    countries = manager.get_countries(cursor=current_cursor, limit=limit, lang=lang, term=term)

    country_list = []

    for country in countries:
        c = {
            'cou_id': country['cou_id'],
            'name': country['name'],
            'code3': country['code3'],
            'lat': country['lat'],
            'long': country['long'],
            'display_names': country['alt_name']
        }
        country_list.append(c)

    if len(country_list) > 0:
        # prev cursor (asc order)
        entity = country_list[0]
        prev_cursor = "%s/%s" % (entity['name'], entity['cou_id'])

        # next cursor (asc order)
        entity = country_list[-1]
        next_cursor = "%s/%s" % (entity['name'], entity['cou_id'])
    else:
        prev_cursor = None
        next_cursor = None

    results = {
        'perms': [],
        'items': country_list,
        'prev': prev_cursor,
        'cursor': str(current_cursor),
        'next': next_cursor,
    }

    return HttpResponseRest(request, results)

@RestGeolocationCountry.def_request(Method.GET, Format.JSON)
def country_list(request):
    """
    Return a list of country in JSON format
    """
    term = request.GET.get('term')
    lang = request.GET.get('lang', 'en')
    results_per_page = int_arg(request.GET.get('more', 30))
    str_cursor = request.GET.get('cursor')
    limit = results_per_page

    manager = instance.geolocation_app.geolocation_manager


    if str_cursor:
        cursor_name, cursor_id = str_cursor.rsplit('/', 1)
        current_cursor = Cursor(cursor_name, int(cursor_id))
    else:
        current_cursor = None

    countries = manager.get_countries(cursor=current_cursor, limit=limit, lang=lang, term=term)

    country_list = []

    for country in countries:
        c = {
            'cou_id': country['cou_id'],
            'name': country['name'],
            'code3': country['code3'],
            'lat': country['lat'],
            'long': country['long'],
            'display_names': country['alt_name']
        }
        country_list.append(c)

    if len(country_list) > 0:
        # prev cursor (asc order)
        entity = country_list[0]
        prev_cursor = "%s/%s" % (entity['name'], entity['cou_id'])

        # next cursor (asc order)
        entity = country_list[-1]
        next_cursor = "%s/%s" % (entity['name'], entity['cou_id'])
    else:
        prev_cursor = None
        next_cursor = None

    results = {
        'perms': [],
        'items': country_list,
        'prev': prev_cursor,
        'cursor': str(current_cursor),
        'next': next_cursor,
    }

    return HttpResponseRest(request, results)

@RestGeolocationCountryId.def_request(Method.GET, Format.JSON)
def country(request, cou_id):
    lang = request.GET.get('lang', 'en')
    manager = instance.geolocation_app.geolocation_manager

    country = manager.get_country(id=int(cou_id), lang=lang)

    result = {
        'cou_id'         : country['cou_id'],
        'name'           : country['name'],
        'code3'          : country['code3'],
        'lat'            : country['lat'],
        'long'           : country['long'],
        'display_names'  : country['alt_name']
    }

    return HttpResponseRest(request, result)

# @RestGeolocationCountry.def_auth_request(
#     Method.POST, Format.JSON, content={
#         "type": "object",
#         "properties": {
#             "name" : {"type": "string", 'minLength': 3, 'maxLength': 50},
#             "code3" : {"type": "string", 'minLength': 3, 'maxLength': 3},
#             "lat" : {"type" : "number"},
#             "long" : {"type" : "number"},
#
#
#         },
#     },
#     perms={'descriptor.add_descriptorgroup': _('You are not allowed to create a group of descriptors')},
#     staff=True
# )
# def create_country(request):
#     group_params = request.data
#
#     manager = instance.geolocation_app.geolocation_manager
#
#     group = manager.create_country(
#         name=group_params['name'],
#         can_delete=True,
#         can_modify=True)
#
#     response = {
#         'id': group.id,
#         'name': group.name,
#         'num_descriptor_types': 0,
#         'can_delete': group.can_delete,
#         'can_modify': group.can_modify
#     }
#
#     return HttpResponseRest(request, response)


@RestGeolocationCitySearch.def_request(Method.GET, Format.JSON)
def search_city(request):
    """
    Quick search for a city
    """

    term = request.GET.get('term')

    lang = request.GET.get('lang', 'en')
    results_per_page = int_arg(request.GET.get('more', 30))
    str_cursor = request.GET.get('cursor')
    limit = results_per_page

    manager = instance.geolocation_app.geolocation_manager

    if str_cursor:
        cursor_name, cursor_id = str_cursor.rsplit('/', 1)
        current_cursor = Cursor(cursor_name, int(cursor_id))
    else:
        current_cursor = None

    cities = manager.get_cities(cursor=current_cursor, limit=limit, lang=lang, term=term)

    city_list = []

    for city in cities:
        c = {
            'cit_id': city['cit_id'],
            'name': city['name'],
            'lat': city['lat'],
            'long': city['long'],
            'display_names': city['alt_name'],
            'cou_id': city['cou_id']
        }
        city_list.append(c)

    if len(city_list) > 0:
        # prev cursor (asc order)
        entity = city_list[0]
        prev_cursor = "%s/%s" % (entity['name'], entity['cit_id'])

        # next cursor (asc order)
        entity = city_list[-1]
        next_cursor = "%s/%s" % (entity['name'], entity['cit_id'])
    else:
        prev_cursor = None
        next_cursor = None

    results = {
        'perms': [],
        'items': city_list,
        'prev': prev_cursor,
        'cursor': str(current_cursor),
        'next': next_cursor,
    }

    return HttpResponseRest(request, results)


@RestGeolocationCityId.def_request(Method.GET, Format.JSON)
def city(request, cit_id):
    lang = request.GET.get('lang', 'en')
    manager = instance.geolocation_app.geolocation_manager

    city = manager.get_city(id=int(cit_id), lang=lang)

    result = {
        'cit_id'         : city['cit_id'],
        'name'           : city['name'],
        'lat'            : city['lat'],
        'long'           : city['long'],
        'display_names'  : city['alt_name'],
        'country_id'     : city['cou_id']
    }

    return HttpResponseRest(request, result)