# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
Views related to the taxon synonym model.
"""
from django.views.decorators.cache import cache_page

from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest
from .models import TaxonSynonymType

from .base import RestTaxonomy


class RestTaxonSynonymType(RestTaxonomy):
    regex = r'^taxon-synonym-type/$'
    name = 'taxon-synonym-type'


@cache_page(60*60*24)
@RestTaxonSynonymType.def_request(Method.GET, Format.JSON)
def synonym_type(request):
    """
    Get the list of type of synonym in JSON
    """
    synonym_types = []

    for st in TaxonSynonymType:
        synonym_types.append({"id": st.value, "value": str(st.label)})

    return HttpResponseRest(request, synonym_types)
