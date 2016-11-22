# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
coll-gate descriptor module, description
"""

from django.views.decorators.cache import cache_page
from igdectk.rest import Format, Method
from igdectk.rest.response import HttpResponseRest

from .models import DescriptorCondition
from .descriptor import RestDescriptor


class RestCondition(RestDescriptor):
    regex = r'^condition/$'
    suffix = 'condition'


@cache_page(60*60*24)
@RestCondition.def_request(Method.GET, Format.JSON)
def get_description_list(request):
    """
    Return the list of conditions values.
    """
    conditions = []

    for condition in DescriptorCondition:
        conditions.append({
            'id': condition.value,
            'value': condition.value,
            'label': str(condition.label)
        })

    return HttpResponseRest(request, conditions)
