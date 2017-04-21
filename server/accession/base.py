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
coll-gate accession rest handler
"""

from igdectk.rest.handler import *


class RestAccession(RestHandler):
    regex = r'^accession/$'
    name = 'accession'

