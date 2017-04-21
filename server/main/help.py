# -*- coding: utf-8; -*-
#
# @file help.py
# @brief 
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2016-09-01
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

"""
coll-gate help views
"""
from igdectk.rest.handler import *

from .main import RestMain


class RestHelp(RestMain):
    regex = r'^help/$'
    name = 'help'


class RestHelpAbout(RestHelp):
    regex = r'^about/$'
    suffix = 'about'


class RestHelpManual(RestHelp):
    regex = r'^manual/$'
    suffix = 'manual'


@RestHelpAbout.def_request(Method.GET, Format.HTML)
def about(request):
    return render(request, 'main/help/about.html', {})


@RestHelpManual.def_request(Method.GET, Format.HTML)
def manual(request):
    return render(request, 'main/help/manual_index.html', {})

