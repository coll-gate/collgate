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
from main.cache import cache_manager

from .models import BatchActionType
from .base import RestAccession

from django.utils.translation import ugettext_lazy as _


class RestBatchActionType(RestAccession):
    regex = r'^batchactiontype/$'
    name = 'batchactiontype'


class RestBatchActionTypeCount(RestBatchActionType):
        regex = r'^count/$'
        name = 'count'


# @cache_page(60*60*24)   # @todo named cache mechanism
# @RestBatchActionType.def_request(Method.GET, Format.JSON)
# def get_batch_action_type_list(request):
#     """
#     Get the list of type of batch-action in JSON
#     @todo invalid cache on batch_action_type model changes
#     @todo filter using cursor
#     """
#     cache_name = 'batch_action_types'
#     batch_action_types = cache_manager.get('accession', cache_name)
#
#     if batch_action_types:
#         return HttpResponseRest(request, batch_action_types)
#
#     batch_action_types = []
#
#     for batch_action_type in BatchActionType.objects.all():
#         batch_action_types.append({
#             'id': batch_action_type.id,
#             'name': batch_action_type.name,
#             # 'value': batch_action_type.name,
#             'label': batch_action_type.get_label(),
#             'format': batch_action_type.format
#         })
#
#     # cache for 24h
#     cache_manager.set('accession', cache_name, batch_action_types, 60 * 60 * 24)
#
#     return HttpResponseRest(request, batch_action_types)


@RestBatchActionTypeCount.def_auth_request(Method.GET, Format.JSON)
def get_batch_action_type_list_count(request):
    from main.cursor import CursorQuery
    cq = CursorQuery(BatchActionType)

    if request.GET.get('search'):
        search = json.loads(request.GET['search'])
        cq.filter(search)

    if request.GET.get('filters'):
        filters = json.loads(request.GET['filters'])
        cq.filter(filters)

    count = cq.count()

    results = {
        'count': count
    }

    return HttpResponseRest(request, results)


@RestBatchActionType.def_request(Method.GET, Format.JSON)
def get_batch_action_type_list(request):
    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = json.loads(request.GET.get('cursor', 'null'))
    limit = results_per_page
    sort_by = json.loads(request.GET.get('sort_by', '[]'))

    if not len(sort_by) or sort_by[-1] not in ('id', '+id', '-id'):
        order_by = sort_by + ['id']
    else:
        order_by = sort_by

    from main.cursor import CursorQuery
    cq = CursorQuery(BatchActionType)

    if request.GET.get('search'):
        search = json.loads(request.GET['search'])
        cq.filter(search)

    if request.GET.get('filters'):
        filters = json.loads(request.GET['filters'])
        cq.filter(filters)

    cq.cursor(cursor, order_by)
    cq.order_by(order_by).limit(limit)

    batch_action_types_items = []

    for batch_action_type in cq:
        batch_action_types_items.append({
            'id': batch_action_type.id,
            'name': batch_action_type.name,
            # 'value': batch_action_type.name,
            'label': batch_action_type.get_label(),
            'format': batch_action_type.format
        })

    results = {
        'perms': [],
        'items': batch_action_types_items,
        'prev': cq.prev_cursor,
        'cursor': cursor,
        'next': cq.next_cursor,
    }

    return HttpResponseRest(request, results)

# @todo management (add, delete, patch)
