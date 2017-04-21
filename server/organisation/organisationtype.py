# -*- coding: utf-8; -*-
#
# @file organisationtype.py
# @brief 
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2017-01-03
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

"""
Views related to the organisation type.
"""

from django.shortcuts import get_object_or_404
from django.views.decorators.cache import cache_page

from descriptor.models import DescriptorType
from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest

from organisation.models import Organisation

from .base import RestOrganisationModule


class RestOrganisationType(RestOrganisationModule):
    regex = r'^organisation-type/$'
    suffix = 'organisation-type'


@cache_page(60*60*24)
@RestOrganisationType.def_request(Method.GET, Format.JSON)
def organisation_type(request):
    """
    Get the list of type of organisation in JSON
    """
    organisation_types = []

    # stored in a type of descriptor
    descriptor_type = get_object_or_404(DescriptorType, code=Organisation.TYPE_CODE)

    cursor_prev, cursor_next, values = descriptor_type.get_values(sort_by='id')

    for st in values:
        organisation_types.append({
            'id': st['id'],
            'value': st['id'],
            'label': st['value0']
        })

    return HttpResponseRest(request, organisation_types)

