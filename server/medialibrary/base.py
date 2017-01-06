# -*- coding: utf-8; -*-
#
# Copyright (c) 2017 INRA UMR1095 GDEC

"""
coll-gate medialibrary REST API
"""

from igdectk.rest.handler import *


class RestMediaLibrary(RestHandler):
    regex = r'^medialibrary/$'
    name = 'medialibrary'
