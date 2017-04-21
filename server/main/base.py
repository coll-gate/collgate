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
Rest handlers.
"""

from igdectk.rest.handler import *


# for single app page with html5 navigation
class RestApp(RestHandler):
    regex = r'^app/((?P<path>\S*)/){0,1}$'
    name = 'home'

