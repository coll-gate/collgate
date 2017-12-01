# -*- coding: utf-8; -*-
#
# @file batchactiontype.py
# @brief coll-gate batch-action rest handler
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2017-01-03
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

from django.views.decorators.cache import cache_page

from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest

from .models import BatchActionType
from .base import RestAccession

from django.utils.translation import ugettext_lazy as _


class RestBatchActionType(RestAccession):
    regex = r'^batch-action-type/$'
    name = 'batch-action-type'


@cache_page(60*60*24)   # @todo named cache mechanism
@RestBatchActionType.def_request(Method.GET, Format.JSON)
def get_batch_action_type_list(request):
    """
    Get the list of type of batch-action in JSON
    @todo how to refresh the cache and clients if values of descriptors changed ?
    @todo filter using cursor
    """
    batch_action_types = []

    for batch_action_type in BatchActionType.objects.all():
        batch_action_types.append({
            'id': batch_action_type.id,
            'name': batch_action_type.name,
            # 'value': batch_action_type.name,
            'label': batch_action_type.get_label(),
            'format': batch_action_type.format
        })

    return HttpResponseRest(request, batch_action_types)


# @todo management (add, delete, patch)
