# -*- coding: utf-8; -*-
#
# @file actionbatch
# @brief collgate 
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2018-04-18
# @copyright Copyright (c) 2018 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

import json

from django.shortcuts import get_object_or_404
from django.utils.translation import ugettext_lazy as _

from accession.models import Action, BatchPanel, Batch
from igdectk.common.helpers import int_arg
from igdectk.rest import Method, Format
from igdectk.rest.response import HttpResponseRest
from .action import RestActionIdStepIdx


class RestActionIdStepIdxBatch(RestActionIdStepIdx):
    regex = r'^batch/$'
    suffix = 'batch'


class RestActionIdStepIdxBatchCount(RestActionIdStepIdx):
    regex = r'^batch/count/$'
    suffix = 'batch/count/'


class RestActionIdStepIdxData(RestActionIdStepIdx):
    regex = r'^data/$'
    suffix = 'data'


class RestActionIdStepIdxDataAccession(RestActionIdStepIdxData):
    regex = r'^accession/$'
    suffix = 'accession'


class RestActionIdStepIdxDataAccessionCount(RestActionIdStepIdxData):
    regex = r'^accession/count/$'
    suffix = 'accession/count/'


@RestActionIdStepIdxBatchCount.def_auth_request(Method.GET, Format.JSON, perms={
    'accession.get_action': _("You are not allowed to get an action"),
    'accession.list_batch': _("You are not allowed to list the batches")
})
def get_action_id_step_idx_batch_list_count(request, act_id, step_idx):
    action = get_object_or_404(Action, pk=int(act_id))
    # @todo check permission on the action

    # any elements of the array are returned
    # in_action_data = get_object_or_404(ActionData, action=action, step_index=step_idx, type=ActionDataType.INPUT.value)
    # out_action_data = get_object_or_404(ActionData, action=action, step_index=step_idx, type=ActionDataType.OUTPUT.value)

    from main.cursor import CursorQuery
    cq = CursorQuery(Batch)

    if request.GET.get('search'):
        search = json.loads(request.GET['search'])
        cq.filter(search)

    if request.GET.get('filters'):
        filters = json.loads(request.GET['filters'])
        cq.filter(filters)

    # working batch panel
    cq.m2m_to_array_field(
        relationship=BatchPanel.batches,
        selected_field='batchpanel_id',
        from_related_field='id',
        to_related_field='batch_id',
        alias='panels'
    )

    results = {
        'count': cq.count()
    }

    return HttpResponseRest(request, results)


@RestActionIdStepIdxBatch.def_auth_request(Method.GET, Format.JSON, perms={
    'accession.get_action': _("You are not allowed to get an action"),
    'accession.list_batch': _("You are not allowed to list the batches")
})
def get_action_id_step_idx_batch_list(request, act_id, step_idx):
    action = get_object_or_404(Action, pk=int(act_id))
    # @todo check permission on the action

    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = json.loads(request.GET.get('cursor', 'null'))
    limit = results_per_page
    sort_by = json.loads(request.GET.get('sort_by', '[]'))

    if not len(sort_by) or sort_by[-1] not in ('id', '+id', '-id'):
        order_by = sort_by + ['id']
    else:
        order_by = sort_by

    from main.cursor import CursorQuery
    cq = CursorQuery(Batch)

    if request.GET.get('search'):
        search = json.loads(request.GET['search'])
        cq.filter(search)

    if request.GET.get('filters'):
        filters = json.loads(request.GET['filters'])
        cq.filter(filters)

    # working batch panel
    cq.m2m_to_array_field(
        relationship=BatchPanel.batches,
        selected_field='batchpanel_id',
        from_related_field='id',
        to_related_field='batch_id',
        alias='panels'
    )

    cq.cursor(cursor, order_by)
    cq.order_by(order_by).limit(limit)

    batch_items = []

    for batch in cq:
        a = {
            'id': batch.pk,
            'name': batch.name,
            'code': batch.code,
            'layout': batch.layout_id,
            'descriptors': batch.descriptors,
        }

        batch_items.append(a)

    results = {
        'perms': [],
        'items': batch_items,
        'prev': cq.prev_cursor,
        'cursor': cursor,
        'next': cq.next_cursor,
    }

    return HttpResponseRest(request, results)
