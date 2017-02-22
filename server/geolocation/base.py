# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
coll-gate accession rest handler
"""

from igdectk.rest.handler import *


class RestAccession(RestHandler):
    regex = r'^accession/$'
    name = 'accession'
