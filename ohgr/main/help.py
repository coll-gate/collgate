# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
ohgr help views
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
