# -*- coding: utf-8; -*-
#
# @file base.py
# @brief 
# @author Medhi BOULNEMOUR (INRA UMR1095)
# @date 2017-01-03
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

"""
coll-gate geolocation rest handler
"""

from igdectk.rest.handler import *


class RestGeolocation(RestHandler):
    regex = r'^geolocation/$'
    name = 'geolocation'

