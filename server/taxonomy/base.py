# -*- coding: utf-8; -*-
#
# @file base.py
# @brief 
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2016-09-01
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

"""
coll-gate taxonomy base rest handler.
"""
from django.utils.translation import ugettext
from igdectk.rest.handler import *


class RestTaxonomy(RestHandler):
    regex = r'^taxonomy/$'
    name = 'taxonomy'

