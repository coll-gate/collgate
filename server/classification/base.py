# -*- coding: utf-8; -*-
#
# @file base.py
# @brief coll-gate classification base rest handler.
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2016-09-01
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

from igdectk.rest.handler import *


class RestClassification(RestHandler):
    regex = r'^classification/$'
    name = 'classification'
