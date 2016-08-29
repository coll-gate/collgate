# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
Rest main handler.
"""
from igdectk.rest.handler import *


class RestMain(RestHandler):
    regex = r'^main/$'
    name = 'main'
