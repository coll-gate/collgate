# -*- coding: utf-8; -*-
#
# @file base.py
# @brief coll-gate medialibrary REST API
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2017-01-03
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

from igdectk.rest.handler import *


class RestMediaLibrary(RestHandler):
    regex = r'^medialibrary/$'
    name = 'medialibrary'
