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

from django.core.exceptions import SuspiciousOperation
from django.shortcuts import get_object_or_404
from django.utils.translation import ugettext_lazy as _

from accession.actions.actioncontroller import ActionController
from accession.models import Action, BatchPanel, Batch
from igdectk.common.helpers import int_arg
from igdectk.rest import Method, Format
from igdectk.rest.response import HttpResponseRest
from .action import RestActionIdTodo, RestActionIdDone


class RestActionIdTodoBatch(RestActionIdTodo):
    regex = r'^batch/$'
    suffix = 'batch'


class RestActionIdDoneBatch(RestActionIdDone):
    regex = r'^batch/$'
    suffix = 'batch'


class RestActionIdTodoBatchCount(RestActionIdTodoBatch):
    regex = r'^count/$'
    suffix = 'count'


class RestActionIdDoneBatchCount(RestActionIdDoneBatch):
    regex = r'^count/$'
    suffix = 'count'


@RestActionIdTodoBatchCount.def_auth_request(Method.GET, Format.JSON, perms={
    'accession.get_action': _("You are not allowed to get an action"),
    'accession.list_batch': _("You are not allowed to list the batches")
})
def get_action_id_todo_batch_list_count(request, act_id):
    action = get_object_or_404(Action, pk=int(act_id))
    # @todo check permission on the action

    action_controller = ActionController(action)

    if not action_controller.is_current_step_valid:
        raise SuspiciousOperation("Invalid current action step")

    panel_id, panel_type = action_controller.todo_panel_id_and_type()

    if panel_type != 'batchpanel':
        raise SuspiciousOperation("Trying to access to a panel of batches but the format does not match")

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


@RestActionIdTodoBatch.def_auth_request(Method.GET, Format.JSON, perms={
    'accession.get_action': _("You are not allowed to get an action"),
    'accession.list_batch': _("You are not allowed to list the batches")
})
def get_action_id_todo_batch_list(request, act_id):
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

    action_controller = ActionController(action)

    if not action_controller.is_current_step_valid:
        raise SuspiciousOperation("Invalid current action step")

    panel_id, panel_type = action_controller.todo_panel_id_and_type()

    if panel_type != 'batchpanel':
        raise SuspiciousOperation("Trying to access to a panel of batches but the format does not match")

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


@RestActionIdDoneBatchCount.def_auth_request(Method.GET, Format.JSON, perms={
    'accession.get_action': _("You are not allowed to get an action"),
    'accession.list_batch': _("You are not allowed to list the batches")
})
def get_action_id_done_batch_list_count(request, act_id):
    action = get_object_or_404(Action, pk=int(act_id))
    # @todo check permission on the action

    action_controller = ActionController(action)

    if not action_controller.is_current_step_valid:
        raise SuspiciousOperation("Invalid current action step")

    panel_id, panel_type = action_controller.done_panel_id_and_type()

    if panel_type != 'batchpanel':
        raise SuspiciousOperation("Trying to access to a panel of batches but the format does not match")

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


@RestActionIdDoneBatch.def_auth_request(Method.GET, Format.JSON, perms={
    'accession.get_action': _("You are not allowed to get an action"),
    'accession.list_batch': _("You are not allowed to list the batches")
})
def get_action_id_todo_batch_list(request, act_id):
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

    action_controller = ActionController(action)

    if not action_controller.is_current_step_valid:
        raise SuspiciousOperation("Invalid current action step")

    panel_id, panel_type = action_controller.done_panel_id_and_type()

    if panel_type != 'batchpanel':
        raise SuspiciousOperation("Trying to access to a panel of batches but the format does not match")

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
