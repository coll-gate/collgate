# -*- coding: utf-8; -*-
#
# @file batchactiontype.py
# @brief 
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2017-01-03
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

"""
coll-gate batch-action rest handler
"""

from django.views.decorators.cache import cache_page

from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest

from .models import BatchActionType
from .base import RestAccession

from django.utils.translation import ugettext_lazy as _


class RestBatchActionType(RestAccession):
    regex = r'^batch-action-type/$'
    name = 'batch-action-type'


@cache_page(60*60*24)
@RestBatchActionType.def_request(Method.GET, Format.JSON)
def get_batch_action_type_list(request):
    """
    Get the list of type of batch-action in JSON
    @todo how to refresh the cache and clients if values of descriptors changed ?
    """
    batch_action_types = []

    for batch_action_type in BatchActionType.objects.all():
        batch_action_types.append({
            'id': batch_action_type.id,
            'value': batch_action_type.name,
            'label': batch_action_type.get_label()
        })

    return HttpResponseRest(request, batch_action_types)

