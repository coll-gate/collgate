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
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import translation
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


class RestBatchActionTypeSearch(RestBatchActionType):
    regex = r'^search/$'
    name = 'search'


class RestBatchActionTypeId(RestBatchActionType):
    regex = r'^(?P<bat_id>[0-9]+)/$'
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

    # @todo named cache mechanism when no filters and default order
    # cache_name = 'batch_action_types'
    # batch_action_types = cache_manager.get('accession', cache_name)
    #
    # if batch_action_types:
    #     return HttpResponseRest(request, batch_action_types)

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
            'format': batch_action_type.format,
            'description': batch_action_type.description
        })

    results = {
        'perms': [],
        'items': batch_action_types_items,
        'prev': cq.prev_cursor,
        'cursor': cursor,
        'next': cq.next_cursor,
    }

    # cache for 24h
    # cache_manager.set('accession', cache_name, batch_action_types, 60 * 60 * 24)

    return HttpResponseRest(request, results)


@RestBatchActionTypeSearch.def_request(Method.GET, Format.JSON)
def get_batch_action_type_search(request):
    filters = json.loads(request.GET['filters'])

    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = request.GET.get('cursor')
    limit = results_per_page

    if cursor:
        cursor = json.loads(cursor)
        cursor_name, cursor_id = cursor
        qs = BatchActionType.objects.filter(Q(name__gt=cursor_name))
    else:
        qs = BatchActionType.objects.all()

    if 'name' in filters['fields']:
        name_method = filters.get('method', 'ieq')
        if name_method == 'ieq':
            qs = qs.filter(name__iexact=filters['name'])
        elif name_method == 'icontains':
            qs = qs.filter(name__icontains=filters['name'])

    qs = qs.order_by('name').distinct()[:limit]

    items_list = []

    for batchactiontype in qs:
        label = batchactiontype.name

        b = {
            'id': batchactiontype.id,
            'value': batchactiontype.name,
            'label': label
        }

        items_list.append(b)

    if len(items_list) > 0:
        # prev cursor (asc order)
        obj = items_list[0]
        prev_cursor = (obj['value'], obj['id'])

        # next cursor (asc order)
        obj = items_list[-1]
        next_cursor = (obj['value'], obj['id'])
    else:
        prev_cursor = None
        next_cursor = None

    results = {
        'perms': [],
        'items': items_list,
        'prev': prev_cursor,
        'cursor': cursor,
        'next': next_cursor,
    }

    return HttpResponseRest(request, results)


@RestBatchActionTypeId.def_auth_request(Method.GET, Format.JSON, perms={
    'accession.get_accession': _("You are not allowed to get a batch action type")
})
def get_batch_action_type_details_json(request, bat_id):
    """
    Get the details of a batch action type.
    """

    batch_action_type = BatchActionType.objects.get(id=int(bat_id))

    result = {
        'id': batch_action_type.id,
        'name': batch_action_type.name,
        'label': batch_action_type.get_label(),
        'format': batch_action_type.format,
        'description': batch_action_type.description
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


@RestBatchActionTypeId.def_auth_request(Method.PATCH, Format.JSON, content={
        "type": "object",
        "properties": {
            "description": {"type": "string", 'maxLength': 1024, "required": False, "blank": True},
            "format": {"type": "object", "required": False},
            "label": BatchActionType.LABEL_VALIDATOR_OPTIONAL
        },
    },
    perms={
      'accession.change_batchactiontype': _("You are not allowed to modify a batch action type"),
    })
def patch_batch_action_type(request, bat_id):
    batch_action_type = get_object_or_404(BatchActionType, id=int(bat_id))

    entity_status = request.data.get("entity_status")
    description = request.data.get("description")
    label = request.data.get("label")
    format_data = request.data.get("format")

    result = {
        'id': batch_action_type.id
    }

    if entity_status is not None and batch_action_type.entity_status != entity_status:
        batch_action_type.set_status(entity_status)
        result['entity_status'] = entity_status
        batch_action_type.update_field('entity_status')

    if description is not None:
        batch_action_type.description = description
        result['description'] = description
        batch_action_type.update_field('description')

    if label is not None:
        lang = translation.get_language()
        batch_action_type.set_label(lang, label)
        result['label'] = label
        batch_action_type.update_field('label')

    if format_data is not None:
        if batch_action_type.format.get('type', 'undefined') != 'undefined':
            raise SuspiciousOperation(_("It is not possible to change the format type"))

        batch_action_type.format = format_data
        result['format'] = format
        batch_action_type.update_field('format')

    batch_action_type.save()

    return HttpResponseRest(request, result)


@RestBatchActionTypeId.def_auth_request(Method.DELETE, Format.JSON, perms={
         'accession.delete_batchactiontype': _('You are not allowed to remove a batch action type'),
    },
    staff=True)
def delete_batch_action_type(request, bat_id):
    """
    If possible delete a descriptor model type from de descriptor model.
    It is not possible if there is data using the model of descriptor or the status is valid.
    """
    batch_action_type = get_object_or_404(BatchActionType, id=int(bat_id))

    # @todo
    # if batch_action_type.in_usage():
    #     raise SuspiciousOperation(_("There is some data using the batch action type"))

    batch_action_type.delete()

    return HttpResponseRest(request, {})


@RestBatchActionType.def_auth_request(
    Method.POST, Format.JSON, content={
        "type": "object",
        "properties": {
            "name": BatchActionType.NAME_VALIDATOR,
            "format": {"type": "object", "required": False},
            "label": BatchActionType.LABEL_VALIDATOR_OPTIONAL,
            "description": {"type": "string", 'maxLength': 1024, "required": False, "blank": True},
        }
    },
    perms={
        'descriptor.add_batchactiontype': _('You are not allowed to create a batch action type'),
    },
    staff=True)
def create_batch_action_type(request):
    """
    Create a new batch action type
    """
    # check name uniqueness
    if BatchActionType.objects.filter(name=request.data['name']).exists():
        raise SuspiciousOperation(_('A batch action with a similar name already exists'))

    description = request.data.get("description")
    label = request.data.get("label")
    format_data = request.data.get("format")
    lang = translation.get_language()

    # create the batch action type
    batch_action_type = BatchActionType()

    batch_action_type.name = request.data['name']
    batch_action_type.set_label(lang, label)
    batch_action_type.description = description
    batch_action_type.format = format_data

    # @todo, allowed if no data using it, and must be checked by BatchActionTypeFormat

    batch_action_type.save()

    result = {
        'id': batch_action_type.id,
        'name': batch_action_type.name,
        'label': batch_action_type.get_label(),
        'format': batch_action_type.format,
        'description': batch_action_type.description
    }

    return HttpResponseRest(request, result)
