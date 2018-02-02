# -*- coding: utf-8; -*-
#
# @file action
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
from accession.models import Action, Accession, ActionType, Batch

from igdectk.common.helpers import int_arg
from igdectk.rest import Method, Format
from igdectk.rest.response import HttpResponseRest


class RestAction(RestAccession):
    regex = r'^action/$'
    name = 'action'


class RestActionId(RestAccession):
    regex = r'^(?P<bat_id>[0-9]+)/$'
    suffix = 'id'


class RestBatchIdAction(RestBatchId):
    regex = r'^action/$'
    suffix = 'action'


class RestBatchIdActionCount(RestBatchIdAction):
    regex = r'^count/$'
    suffix = 'count'


# @todo how to precise which collection when boolean ? temporary panel ?
@RestAction.def_auth_request(Method.POST, Format.JSON, content={
        "type": "object",
        "properties": {
            "accession": {"type": "number"},
            "type": {"type": "number"},
            "batches": {
                "type": [{
                    "type": "object",
                    "properties": {
                        "op": {"type": "string", "enum": ['in', 'notin']},
                        "term": {"type": "string"},
                        "value": {"type": "array", "minItems": 0, "maxItems": 32768, "additionalItems": {"type": "number"}, "items": []}
                    },
                }, {
                    "type": "boolean"
                }]
            }
        },
    }, perms={
        'accession.add_action': _("You are not allowed to create an action")
    }
                             )
def create_action(request):
    accession_id = int_arg(request.data.get('accession'))
    action_type_id = int_arg(request.data.get('type'))
    batches = request.data.get('batches')

    user = request.user

    if accession_id > 0:
        accession = get_object_or_404(Accession, pk=accession_id)
    else:
        accession = None

    batch_action_type = get_object_or_404(ActionType, pk=action_type_id)

    if batches is not None and type(batches) is bool:
        # @todo from which collection ?
        input_batches = None
    else:
        if batches["op"] == "in":
            input_batches = Batch.objects.filter(id__in=batches["value"])
        elif batches["op"] == "notin":
            input_batches = Batch.objects.all().exclude(id__in=batches["value"])

    # @todo step by step...
    # batch_action_type_format = ActionStepFormatManager.get(batch_action_type.format.get('type'))
    # batch_action = batch_action_type_format.controller().create(batch_action_type, accession, user, input_batches)
    #
    # result = {
    #     'id': batch_action.id,
    #     'accession': accession_id,
    #     'user': user.username,
    #     'type': batch_action.type_id
    # }
    result = {}

    return HttpResponseRest(request, result)


@RestBatchIdAction.def_auth_request(Method.GET, Format.JSON, perms={
    'accession.get_action': _("You are not allowed to get an action"),
    'accession.list_action': _("You are not allowed to list actionstep")
})
def get_batch_id_action_list(request, bat_id):
    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = json.loads(request.GET.get('cursor', 'null'))
    limit = results_per_page
    sort_by = json.loads(request.GET.get('sort_by', '[]'))

    # @todo how to manage permission to list only auth actionstep

    if not len(sort_by) or sort_by[-1] not in ('id', '+id', '-id'):
        order_by = sort_by + ['id']
    else:
        order_by = sort_by

    from main.cursor import CursorQuery
    cq = CursorQuery(Action)

    # @todo filter for action relating this batch as input...
    cq.join('input_batches')
    # cq.filter(input_batches__in=int(bat_id))

    if request.GET.get('search'):
        search = json.loads(request.GET['search'])
        cq.filter(search)

    if request.GET.get('filters'):
        filters = json.loads(request.GET['filters'])
        cq.filter(filters)

    cq.cursor(cursor, order_by)
    cq.order_by(order_by).limit(limit)
    # print(cq.sql())
    batch_action_list = []

    for action in cq:
        a = {
            'id': action.id,
            'accession': action.accession_id,
            'type': action.type_id,
            'data': action.data,
            'created_date': action.created_date.strftime("%Y-%m-%d %H:%M:%S")
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


@RestBatchIdActionCount.def_auth_request(Method.GET, Format.JSON, perms={
    'accession.list_action': _("You are not allowed to list the actionstep")
})
def get_batch_id_action_list_count(request, bat_id):
    from main.cursor import CursorQuery
    cq = CursorQuery(Action)

    if request.GET.get('search'):
        search = json.loads(request.GET['search'])
        cq.filter(search)

    if request.GET.get('filters'):
        filters = json.loads(request.GET['filters'])
        cq.filter(filters)

    # @todo filter for action relating this batch as input...
    cq.join('input_batches')

    count = cq.count()
    # cq.filter(input_batches__in=int(bat_id))

    results = {
        'count': count
    }

    return HttpResponseRest(request, results)
