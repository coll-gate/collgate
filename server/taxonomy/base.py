# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
coll-gate taxonomy base rest handler.
"""
from django.utils.translation import ugettext
from igdectk.rest.handler import *


class RestTaxonomy(RestHandler):
    regex = r'^taxonomy/$'
    name = 'taxon'
