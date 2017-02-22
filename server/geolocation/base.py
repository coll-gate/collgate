# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
coll-gate geolocation rest handler
"""

from igdectk.rest.handler import *


class RestGeolocation(RestHandler):
    regex = r'^geolocation/$'
    name = 'geolocation'
