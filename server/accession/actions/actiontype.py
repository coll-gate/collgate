# -*- coding: utf-8; -*-
#
# @file action.py
# @brief coll-gate action rest handler
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

from accession.actions.actioncontroller import ActionController
from accession.actions.actionstepformat import ActionStepFormatManager
from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest
from main.cache import cache_manager
from main.models import InterfaceLanguages
from permission.utils import get_permissions_for

from accession.models import ActionType
from accession.base import RestAccession

from django.utils.translation import ugettext_lazy as _


class RestActionType(RestAccession):
    regex = r'^actiontype/$'
    name = 'actiontype'


class RestActionTypeCount(RestActionType):
    regex = r'^count/$'
    name = 'count'


class RestActionTypeSearch(RestActionType):
    regex = r'^search/$'
    name = 'search'


class RestActionTypeId(RestActionType):
    regex = r'^(?P<act_id>[0-9]+)/$'
    suffix = 'id'


class RestActionTypeFormat(RestActionType):
    regex = r'^stepformat/$'
    suffix = 'stepformat'


class RestActionTypeIdLabel(RestActionTypeId):
    regex = r'^label/$'
    suffix = 'label'


@RestActionTypeCount.def_auth_request(Method.GET, Format.JSON)
def get_action_type_list_count(request):
    from main.cursor import CursorQuery
    cq = CursorQuery(ActionType)

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


@RestActionType.def_request(Method.GET, Format.JSON)
def get_action_type_list(request):
    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = json.loads(request.GET.get('cursor', 'null'))
    limit = results_per_page
    sort_by = json.loads(request.GET.get('sort_by', '[]'))

    # @todo named cache mechanism when no filters and default order
    # cache_name = 'action_types'
    # action_types = cache_manager.get('accession', cache_name)
    #
    # if action_types:
    #     return HttpResponseRest(request, action_types)

    if not len(sort_by) or sort_by[-1] not in ('id', '+id', '-id'):
        order_by = sort_by + ['id']
    else:
        order_by = sort_by

    from main.cursor import CursorQuery
    cq = CursorQuery(ActionType)

    if request.GET.get('search'):
        search = json.loads(request.GET['search'])
        cq.filter(search)

    if request.GET.get('filters'):
        filters = json.loads(request.GET['filters'])
        cq.filter(filters)

    cq.cursor(cursor, order_by)
    cq.order_by(order_by).limit(limit)

    action_types_items = []

    for action_type in cq:
        action_types_items.append({
            'id': action_type.id,
            'name': action_type.name,
            # 'value': action_type.name,
            'label': action_type.get_label(),
            'format': action_type.format,
            'description': action_type.description
        })

    results = {
        'perms': [],
        'items': action_types_items,
        'prev': cq.prev_cursor,
        'cursor': cursor,
        'next': cq.next_cursor,
    }

    # cache for 24h
    # cache_manager.set('accession', cache_name, action_types, 60*60*24)

    return HttpResponseRest(request, results)


@RestActionTypeSearch.def_request(Method.GET, Format.JSON)
def get_action_type_search(request):
    filters = json.loads(request.GET['filters'])

    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = request.GET.get('cursor')
    limit = results_per_page

    if cursor:
        cursor = json.loads(cursor)
        cursor_name, cursor_id = cursor
        qs = ActionType.objects.filter(Q(name__gt=cursor_name))
    else:
        qs = ActionType.objects.all()

    if 'name' in filters['fields']:
        name_method = filters.get('method', 'ieq')
        if name_method == 'ieq':
            qs = qs.filter(name__iexact=filters['name'])
        elif name_method == 'icontains':
            qs = qs.filter(name__icontains=filters['name'])

    qs = qs.order_by('name').distinct()[:limit]

    items_list = []

    for actiontype in qs:
        label = actiontype.name

        b = {
            'id': actiontype.id,
            'value': actiontype.name,
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


@RestActionTypeId.def_auth_request(Method.GET, Format.JSON, perms={
    'accession.get_actiontype': _("You are not allowed to get an action type")
})
def get_action_type_details_json(request, act_id):
    """
    Get the details of a action type.
    """
    action_type = ActionType.objects.get(id=int(act_id))

    result = {
        'id': action_type.id,
        'name': action_type.name,
        'label': action_type.get_label(),
        'format': action_type.format,
        'description': action_type.description
    }

    return HttpResponseRest(request, result)


@cache_page(60*60*24)
@RestActionTypeFormat.def_request(Method.GET, Format.JSON)
def get_format_type_list(request):
    """
    Return the list of format of action type
    """
    groups = {}
    items = {}

    for ft in ActionStepFormatManager.values():
        if ft.group:
            if ft.group.name not in groups:
                groups[ft.group.name] = {
                    'group': ft.group.name,
                    'label': str(ft.group.verbose_name)
                }

        if ft.name in items:
            raise SuspiciousOperation("Already registered format of action type %s" % ft.name)

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


@RestActionTypeId.def_auth_request(Method.PATCH, Format.JSON, content={
        "type": "object",
        "properties": {
            "name": ActionType.NAME_VALIDATOR_OPTIONAL,
            "description": {"type": "string", 'maxLength': 1024, "required": False, "blank": True},
            "format": {"type": "object", "required": False},
            "label": ActionType.LABEL_VALIDATOR_OPTIONAL
        },
    }, perms={
      'accession.change_actiontype': _("You are not allowed to modify an action type"),
    })
def patch_action_type(request, act_id):
    action_type = get_object_or_404(ActionType, id=int(act_id))

    name = request.data.get("name")
    entity_status = request.data.get("entity_status")
    description = request.data.get("description")
    label = request.data.get("label")
    format_data = request.data.get("format")

    action_controller = ActionController(action_type)

    result = {
        'id': action_type.id
    }

    if entity_status is not None and action_type.entity_status != entity_status:
        action_type.set_status(entity_status)
        result['entity_status'] = entity_status
        action_type.update_field('entity_status')

    if name is not None:
        action_type.name = name
        result['name'] = name
        action_type.update_field('name')

    if description is not None:
        action_type.description = description
        result['description'] = description
        action_type.update_field('description')

    if label is not None:
        lang = translation.get_language()
        action_type.set_label(lang, label)
        result['label'] = label
        action_type.update_field('label')

    if format_data is not None:
        if 'steps' not in format_data:
            raise SuspiciousOperation(_("Invalid format"))

        action_type.format['steps'] = []
        step_index = 0

        for step in format_data['steps']:
            # step format validation
            ActionStepFormatManager.check(action_controller, step)

            # validate data consistency from previous and this step
            if step_index > 0:
                prev_step = action_type.format['steps'][step_index-1]
                if not ActionStepFormatManager.data_consistency(step, prev_step):
                    raise SuspiciousOperation(_("Inconsistency between the output format of the previous step and the input format of this step"))

            action_type.format['steps'].append(step)

            step_index += 1

        result['format'] = action_type.format
        action_type.update_field('format')

    action_type.save()

    return HttpResponseRest(request, result)


@RestActionTypeId.def_auth_request(Method.DELETE, Format.JSON, perms={
         'accession.delete_actiontype': _('You are not allowed to remove an action type'),
    }, staff=True)
def delete_action_type(request, act_id):
    """
    If possible delete a descriptor model type from de descriptor model.
    It is not possible if there is data using the model of descriptor or the status is valid.
    """
    action_type = get_object_or_404(ActionType, id=int(act_id))

    if action_type.in_usage():
        raise SuspiciousOperation(_("There is some data using the action type"))

    action_type.delete()

    return HttpResponseRest(request, {})


@RestActionType.def_auth_request(
    Method.POST, Format.JSON, content={
        "type": "object",
        "properties": {
            "name": ActionType.NAME_VALIDATOR,
            "format": {"type": "object", "required": False},
            "label": ActionType.LABEL_VALIDATOR_OPTIONAL,
            "description": {"type": "string", 'maxLength': 1024, "required": False, "blank": True},
        }
    },
    perms={
        'descriptor.add_actiontype': _('You are not allowed to create an action type'),
    },
    staff=True)
def create_action_type(request):
    """
    Create a new action type
    """
    # check name uniqueness
    if ActionType.objects.filter(name=request.data['name']).exists():
        raise SuspiciousOperation(_('An action with a similar name already exists'))

    description = request.data.get("description")
    label = request.data.get("label")
    format_data = request.data.get("format", {'type': 'undefined'})
    lang = translation.get_language()

    # create the action type
    action_type = ActionType()
    action_type.name = request.data['name']
    action_type.set_label(lang, label)
    action_type.description = description
    action_type.format = format_data

    action_controller = ActionController(action_type, request.user)

    if format_data['type'] != 'undefined':
        # format validation
        ActionStepFormatManager.check(action_controller, format_data)

    action_type.save()

    result = {
        'id': action_type.id,
        'name': action_type.name,
        'label': action_type.get_label(),
        'format': action_type.format,
        'description': action_type.description
    }

    return HttpResponseRest(request, result)


@RestActionTypeIdLabel.def_auth_request(Method.GET, Format.JSON)
def get_all_labels_of_action_type(request, act_id):
    """
    Returns labels for each language related to the user interface.
    """
    action_type = get_object_or_404(ActionType, id=int(act_id))

    label_dict = action_type.label

    # complete with missing languages
    for lang, lang_label in InterfaceLanguages.choices():
        if lang not in label_dict:
            label_dict[lang] = ""

    results = label_dict

    return HttpResponseRest(request, results)


@RestActionTypeIdLabel.def_auth_request(
    Method.PUT, Format.JSON, content={
        "type": "object",
        "additionalProperties": ActionType.LABEL_VALIDATOR
    }, perms={
        'accession.change_actiontype': _('You are not allowed to modify an action type'),
    }, staff=True)
def change_all_labels_of_action_type(request, act_id):
    """
    Changes all the label, for each language related to the user interface.
    Returns only the local label.
    """
    action_type = get_object_or_404(ActionType, id=int(act_id))

    labels = request.data

    languages_values = [lang[0] for lang in InterfaceLanguages.choices()]

    for lang, label in labels.items():
        if lang not in languages_values:
            raise SuspiciousOperation(_("Unsupported language identifier"))

    action_type.label = labels

    action_type.update_field('label')
    action_type.save()

    result = {
        'label': action_type.get_label()
    }

    return HttpResponseRest(request, result)
