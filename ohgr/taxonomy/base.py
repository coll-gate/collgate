# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
ohgr taxonomy base rest handler.
"""
from igdectk.rest.handler import *


class RestTaxonomy(RestHandler):
    regex = r'^taxonomy/$'
    name = 'taxon'
