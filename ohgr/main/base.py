# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
Rest handlers.
"""

from igdectk.rest.handler import *


# for single app page with html5 navigation
class RestApp(RestHandler):
    regex = r'^app/(?P<path>\S+?)/$'
    name = 'home'
