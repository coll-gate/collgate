# -*- coding: utf-8; -*-
#
# Copyright (c) 2017 INRA UMR1095 GDEC

"""
coll-gate geolocation manager for cities light
"""

from django.db.models import Q
from geolocation.geolocationinterface import GeolocationInterface
from geonames.models import Country, Region, City

class GeolocationManager(GeolocationInterface):

    def format_type_validator(self, value):
        return True

    def get_countries(self, cursor, limit, order_by):

        if cursor:
            qs = Country.objects.filter(Q(name__gte=cursor.get_name(), id__gt=cursor.get_id()))
        else:
            qs = Country.objects.all()
        tqs = qs.order_by(order_by, 'id')[:limit]
        return tqs

    def get_country(self, id, lang):
        return Country.objects.get(id=id)