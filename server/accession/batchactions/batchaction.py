# -*- coding: utf-8; -*-
#
# @file batchaction
# @brief collgate 
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2018-01-05
# @copyright Copyright (c) 2018 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details
import json

from django.shortcuts import get_object_or_404
from django.utils.translation import ugettext_lazy as _

from accession.base import RestAccession
from accession.batch import RestBatchId
from accession.batchactiontypeformat import BatchActionTypeFormatManager
from accession.models import BatchAction, Accession, BatchActionType, Batch

from igdectk.common.helpers import int_arg
from igdectk.rest import Method, Format
from igdectk.rest.response import HttpResponseRest


class RestBatchAction(RestAccession):
    regex = r'^batchaction/$'
    name = 'batchaction'


class RestBatchActionId(RestAccession):
    regex = r'^(?P<bat_id>[0-9]+)/$'
    suffix = 'id'


class RestBatchIdBatchAction(RestBatchId):
    regex = r'^batchaction/$'
    suffix = 'batchaction'


class RestBatchIdBatchActionCount(RestBatchIdBatchAction):
    regex = r'^count/$'
    suffix = 'count'


@RestBatchAction.def_auth_request(Method.POST, Format.JSON, content={
        "type": "object",
        "properties": {
            "name": BatchAction.NAME_VALIDATOR,
            "accession": {"type": "number"},
            "type": {"type": "number"}
        },
    }, perms={
        'accession.add_batchaction': _("You are not allowed to create an action for a batch")
    }
)
def create_batch_action(request):
    accession_id = int_arg(request.data.get('accession'))
    batch_action_type_id = int_arg(request.data.get('type'))

    user = request.user

    accession = get_object_or_404(Accession, pk=accession_id)
    batch_action_type = get_object_or_404(BatchActionType, pk=batch_action_type_id)

    # format type might be 'creation'
    batch_action_type_format = BatchActionTypeFormatManager.get(batch_action_type.format.get('type'))

    batch_action = batch_action_type_format.controller().create(batch_action_type, accession, user)

    result = {
        'id': batch_action.pk,
        'accession': accession_id,
        'user': user.username,
        'type': batch_action.type_id
    }

    return HttpResponseRest(request, result)


@RestBatchIdBatchAction.def_auth_request(Method.GET, Format.JSON, perms={
    'accession.get_batchaction': _("You are not allowed to get a batch action"),
    'accession.list_batchaction': _("You are not allowed to list the batch actions")
})
def get_batch_action_list(request, bat_id):
    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = json.loads(request.GET.get('cursor', 'null'))
    limit = results_per_page
    sort_by = json.loads(request.GET.get('sort_by', '[]'))

    # @todo how to manage permission to list only auth batches actions

    if not len(sort_by) or sort_by[-1] not in ('id', '+id', '-id'):
        order_by = sort_by + ['id']
    else:
        order_by = sort_by

    from main.cursor import CursorQuery
    cq = CursorQuery(BatchAction)

    # @todo filter for action relating this batch as input...
    cq.join('input_batches')

    if request.GET.get('search'):
        search = json.loads(request.GET['search'])
        cq.filter(search)

    if request.GET.get('filters'):
        filters = json.loads(request.GET['filters'])
        cq.filter(filters)

    cq.cursor(cursor, order_by)
    cq.order_by(order_by).limit(limit)
    print(cq.sql())
    batch_action_list = []

    for batch_action in cq:
        a = {
            'id': batch_action.id,
            'accession': batch_action.accession_id,
            # @todo
        }

        batch_action_list.append(a)

    results = {
        'perms': [],
        'items': batch_action_list,
        'prev': cq.prev_cursor,
        'cursor': cursor,
        'next': cq.next_cursor,
    }

    return HttpResponseRest(request, results)


@RestBatchIdBatchActionCount.def_auth_request(Method.GET, Format.JSON, perms={
    'accession.list_batchaction': _("You are not allowed to list the batch actions")
})
def get_batch_list_count(request, bat_id):
    from main.cursor import CursorQuery
    cq = CursorQuery(BatchAction)
    return 0
    if request.GET.get('search'):
        search = json.loads(request.GET['search'])
        cq.filter(search)

    if request.GET.get('filters'):
        filters = json.loads(request.GET['filters'])
        cq.filter(filters)

    count = cq.count()
    cq.filter(input_batches__in=int(bat_id))

    results = {
        'count': count
    }

    return HttpResponseRest(request, results)
