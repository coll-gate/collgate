# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
coll-gate geolocation rest handler
"""

from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest
from .base import RestGeolocation
from .apps import CollGateGeolocation

class RestGeolocationCountry(RestGeolocation):
    regex = r'^country/$'
    name = 'country'

@RestGeolocationCountry.def_request(Method.GET, Format.JSON)
def country_list(request):

    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = request.GET.get('cursor')
    limit = results_per_page

    countries = CollGateGeolocation.geolocation_manager.get_countries(cursor, limit)
    country_list = []

    for country in countries:
        c = {
            'id'  : country.id,
            'name': country.name
        }
        country_list.append(c)

    if len(country_list) > 0:
        # prev cursor (asc order)
        entity = country_list[0]
        prev_cursor = "%s/%s" % (entity['name'], entity['id'])

        # next cursor (asc order)
        entity = country_list[-1]
        next_cursor = "%s/%s" % (entity['name'], entity['id'])
    else:
        prev_cursor = None
        next_cursor = None

    results = {
        'perms': [],
        'items': country_list,
        'prev': prev_cursor,
        'cursor': cursor,
        'next': next_cursor,
    }

    return HttpResponseRest(request, results)