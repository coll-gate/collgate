# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
ohgr taxonomy rest handler
"""

from igdectk.rest.handler import *


class RestTaxonomy(RestHandler):
    regex = r'^/$'
    name = 'taxon'


@RestTaxonomy.def_request(Method.GET, Format.HTML)
def view(request):
    return render(request, 'main/home.html', {})
