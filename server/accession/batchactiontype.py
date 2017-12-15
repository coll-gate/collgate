# -*- coding: utf-8; -*-
#
# @file batchactiontype.py
# @brief coll-gate batch-action rest handler
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2017-01-03
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details
from django.core.exceptions import SuspiciousOperation
from django.views.decorators.cache import cache_page

from accession.batchactiontypeformat import BatchActionTypeFormatManager
from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest
from main.cache import cache_manager
from permission.utils import get_permissions_for

from .models import BatchActionType
from .base import RestAccession

from django.utils.translation import ugettext_lazy as _


class RestBatchActionType(RestAccession):
    regex = r'^batchactiontype/$'
    name = 'batchactiontype'


class RestBatchActionTypeCount(RestBatchActionType):
        regex = r'^count/$'
        name = 'count'


class RestBatchActionTypeId(RestBatchActionType):
    regex = r'^(?P<bac_id>[0-9]+)/$'
    suffix = 'id'


class RestBatchActionTypeFormat(RestBatchActionType):
    regex = r'^format/$'
    suffix = 'format'


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


@RestBatchActionTypeId.def_auth_request(Method.GET, Format.JSON, perms={
    'accession.get_accession': _("You are not allowed to get a batch action type")
})
def get_batch_action_type_details_json(request, bac_id):
    """
    Get the details of a batch action type.
    """

    batch_action_type = BatchActionType.objects.get(id=int(bac_id))

    result = {
        'id': batch_action_type.id,
        'name': batch_action_type.name,
        'label': batch_action_type.get_label(),
        'format': batch_action_type.format
    }

    return HttpResponseRest(request, result)


@cache_page(60 * 60 * 24)
@RestBatchActionTypeFormat.def_request(Method.GET, Format.JSON)
def get_format_type_list(request):
    """
    Return the list of format of batch action type
    """
    groups = {}
    items = {}

    for ft in BatchActionTypeFormatManager.values():
        if ft.group:
            if ft.group.name not in groups:
                groups[ft.group.name] = {
                    'group': ft.group.name,
                    'label': str(ft.group.verbose_name)
                }

        if ft.name in items:
            raise SuspiciousOperation("Already registered format of batch action type %s" % ft.name)

        items[ft.name] = {
            'id': ft.name,
            'group': ft.group.name,
            'value': ft.name,
            'label': str(ft.verbose_name)
        }

    groups_list = sorted(list(groups.values()), key=lambda x: x['group'])
    items_list = sorted(list(items.values()), key=lambda x: x['label'])

    results = {
        'groups': groups_list,
        'items': items_list
    }

    return HttpResponseRest(request, results)


# @todo management (add, delete, patch)
