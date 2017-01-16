# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
Views related to the accession synonym model.
"""
from django.shortcuts import get_object_or_404
from django.views.decorators.cache import cache_page

from descriptor.models import DescriptorType
from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest


from .base import RestAccession


class RestAccessionSynonymType(RestAccession):
    regex = r'^accession-synonym-type/$'
    name = 'accession-synonym-type'


@cache_page(60*60*24)
@RestAccessionSynonymType.def_request(Method.GET, Format.JSON)
def synonym_type(request):
    """
    Get the list of type of synonym in JSON
    """
    synonym_types = []

    # stored in a type of descriptor
    descriptor_type = get_object_or_404(DescriptorType, code='IN_001')

    cursor_prev, cursor_next, values = descriptor_type.get_values(sort_by='id')

    for st in values:
        synonym_types.append({
            'id': st['id'],
            'value': st['id'],
            'label': st['value0']
        })

    return HttpResponseRest(request, synonym_types)


