# -*- coding: utf-8; -*-
#
# @file layout.py
# @brief coll-gate descriptor module, descriptor layout
# @author Frédéric SCHERMA (INRA UMR1095), Medhi BOULNEMOUR (INRA UMR1095)
# @date 2016-09-01
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

import json

from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import SuspiciousOperation, ValidationError
from django.db.models import Q, Count
from django.shortcuts import get_object_or_404
from django.utils import translation
from django.utils.translation import ugettext_lazy as _

from descriptor.descriptorformattype import DescriptorFormatTypeManager
from descriptor.layouttype import LayoutTypeManager
from igdectk.common.helpers import int_arg
from igdectk.rest import Format, Method
from igdectk.rest.response import HttpResponseRest

from main.models import InterfaceLanguages
from .descriptor import RestDescriptor
from .models import Layout, Descriptor, DescriptorCondition


class RestLayout(RestDescriptor):
    regex = r'^layout/$'
    suffix = 'layout'


class RestLayoutCount(RestLayout):
    regex = r'^count/$'
    suffix = 'count'


class RestLayoutSearch(RestLayout):
    regex = r'^search/$'
    suffix = 'search'


class RestLayoutId(RestLayout):
    regex = r'^(?P<layout_id>[0-9]+)/$'
    suffix = 'id'


class RestLayoutIdPanel(RestLayoutId):
    regex = r'^panel/$'
    suffix = 'panel'


class RestLayoutIdPanelId(RestLayoutIdPanel):
    regex = r'^(?P<pan_id>[0-9]+)/$'
    suffix = 'id'


class RestLayoutIdDescriptor(RestLayoutId):
    regex = r'^descriptor/$'
    suffix = 'descriptor'


class RestLayoutIdPanelOrder(RestLayoutIdPanel):
    regex = r'^order/$'
    suffix = 'order'


class RestLayoutIdDescriptorOrder(RestLayoutIdDescriptor):
    regex = r'^order/$'
    suffix = 'order'


class RestLayoutValues(RestLayout):
    regex = r'^values/$'
    suffix = 'values'


class RestLayoutForDescribable(RestLayout):
    regex = r'^for-describable/(?P<content_type_name>[a-zA-Z\.-]+)/$'
    suffix = 'for-describable'


class RestLayoutIdLabel(RestLayoutId):
    regex = r'^label/$'
    suffix = 'label'


class RestLayoutIdPanelIdLabel(RestLayoutIdPanelId):
    regex = r'^label/$'
    suffix = 'label'


class RestLayoutIdPanelIdDescriptor(RestLayoutIdPanelId):
    regex = r'^descriptor/$'
    suffix = 'descriptor'


class RestLayoutIdPanelIdDescriptorId(RestLayoutIdPanelIdDescriptor):
    regex = r'^(?P<desc_id>[0-9]+)/$'
    suffix = 'id'


class RestLayoutIdPanelIdDescriptorIdCondition(RestLayoutIdPanelIdDescriptorId):
    regex = r'^condition/$'
    suffix = 'condition'


@RestLayout.def_auth_request(Method.GET, Format.JSON)
def get_list_layouts(request):
    """
    Returns a list of metal-models of descriptors ordered by name.
    """
    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = json.loads(request.GET.get('cursor', 'null'))
    limit = results_per_page
    sort_by = json.loads(request.GET.get('sort_by', '[]'))

    if not len(sort_by) or sort_by[-1] not in ('id', '+id', '-id'):
        order_by = sort_by + ['id']
    else:
        order_by = sort_by

    from main.cursor import CursorQuery
    cq = CursorQuery(Layout)

    if request.GET.get('search'):
        cq.filter(json.loads(request.GET['search']))

    if request.GET.get('filters'):
        cq.filter(json.loads(request.GET['filters']))

    cq.cursor(cursor, order_by)
    # cq.set_count('descriptor_models')
    # cq.set_count('panels')
    cq.order_by(order_by).limit(limit)

    cq.prefetch_related('target')

    layout_items = []

    for layout in cq:
        d = {
            'id': layout.id,
            'name': layout.name,
            'label': layout.get_label(),
            'description': layout.description,
            'target': '.'.join(layout.target.natural_key()),
            'parameters': layout.parameters,
            # 'layout_content': layout.layout_content
            # 'num_descriptor_models': layout.panels__count  # 0 #layout.descriptor_models__count
        }

        layout_items.append(d)

    results = {
        'perms': [],
        'items': layout_items,
        'prev': cq.prev_cursor,
        'cursor': cursor,
        'next': cq.next_cursor,
    }

    return HttpResponseRest(request, results)


@RestLayoutCount.def_auth_request(Method.GET, Format.JSON)
def get_count_layouts(request):
    """
    Returns a list of metal-models of descriptors ordered by name.
    """
    from main.cursor import CursorQuery
    cq = CursorQuery(Layout)

    if request.GET.get('search'):
        cq.filter(json.loads(request.GET['search']))

    if request.GET.get('filters'):
        cq.filter(json.loads(request.GET['filters']))

    count = cq.count()

    results = {
        'count': count
    }

    return HttpResponseRest(request, results)


@RestLayout.def_auth_request(Method.POST, Format.JSON, content={
    "type": "object",
    "properties": {
        "name": Layout.NAME_VALIDATOR,
        "label": Layout.LABEL_VALIDATOR,
        "target": Layout.CONTENT_TYPE_VALIDATOR,
        "description": {"type": "string", 'minLength': 0, 'maxLength': 1024, 'blank': True}
    },
},
                             perms={'descriptor.add_layout': _('You are not allowed to create a layout of descriptor')},
                             staff=True)
def create_layout(request):
    app_label, model = request.data['target'].split('.')

    content_type = get_object_or_404(ContentType, app_label=app_label, model=model)

    lang = translation.get_language()

    layout = Layout()

    layout.name = request.data['name']
    layout.set_label(lang, request.data['label'])
    layout.description = request.data['description'].strip()
    layout.target = content_type

    layout.full_clean()
    layout.save()

    result = {
        'id': layout.id,
        'name': layout.name,
        'label': layout.get_label(),
        'description': layout.description,
        'parameters': layout.parameters,
        'target': '.'.join(content_type.natural_key()),
        # 'num_descriptor_models': 0
    }

    return HttpResponseRest(request, result)


@RestLayoutValues.def_auth_request(Method.GET, Format.JSON, parameters=('values',))
def get_layout_values(request):
    # json array
    values = json.loads(request.GET['values'])

    layouts = Layout.objects.filter(id__in=values)

    items = {}

    for layout in layouts:
        items[layout.id] = layout.get_label()

    results = {
        'cacheable': True,
        'validity': None,
        'items': items
    }

    return HttpResponseRest(request, results)


@RestLayoutForDescribable.def_auth_request(Method.GET, Format.JSON)
def get_layout_for_describable(request, content_type_name):
    app_label, model = content_type_name.split('.')
    content_type = get_object_or_404(ContentType, app_label=app_label, model=model)

    layouts = Layout.objects.filter(target=content_type)

    items = []

    for layout in layouts:
        items.append({
            'id': layout.id,
            'name': layout.name,
            'label': layout.get_label(),
            'parameters': layout.parameters
        })

    return HttpResponseRest(request, items)


@RestLayoutId.def_auth_request(Method.GET, Format.JSON)
def get_layout(request, layout_id):
    layout = get_object_or_404(Layout, id=int(layout_id))

    result = {
        'id': layout.id,
        'name': layout.name,
        'label': layout.label,
        'description': layout.description,
        'target': '.'.join(layout.target.natural_key()),
        'parameters': layout.parameters,
        'layout_content': layout.layout_content
    }

    return HttpResponseRest(request, result)


@RestLayoutId.def_auth_request(Method.DELETE, Format.JSON,
                               perms={'descriptor.remove_layout': _(
                                   'You are not allowed to remove a layout of descriptor')},
                               staff=True)
def delete_layout(request, layout_id):
    layout = get_object_or_404(Layout, id=int(layout_id))

    if layout.in_usage():
        raise SuspiciousOperation(_("There is some data using the layout of descriptor"))

    layout.delete()

    return HttpResponseRest(request, {})


@RestLayoutId.def_auth_request(Method.PUT, Format.JSON, content={
    "type": "object",
    "properties": {
        "name": Layout.NAME_VALIDATOR,
        "description": {"type": "string", 'minLength': 0, 'maxLength': 1024, 'blank': True},
        "parameters": {
            "type": "object",
            "properties": {
                "type": {"type": "string", 'minLength': 3, 'maxLength': 128},
                "data": {"type": "object"}
            }
        }
    },
},
                               perms={'descriptor.change_layout': _(
                                   'You are not allowed to modify a layout of descriptor')},
                               staff=True)
def modify_layout(request, layout_id):
    layout = get_object_or_404(Layout, id=int(layout_id))

    # parameters type must be target name
    if request.data['parameters']['type'] != ".".join([layout.target.app_label, layout.target.model]):
        raise SuspiciousOperation(_("Inconsistent parameters->type with target model"))

    # check parameters
    if LayoutTypeManager.has(layout.target.model_class()):  # request.data['parameters']['type']):
        LayoutTypeManager.check(layout.target.model_class(), request.data['parameters']['data'])

    layout.name = request.data['name']
    layout.description = request.data['description'].strip()
    layout.parameters = request.data['parameters']

    layout.save()

    result = {
        'id': layout.id,
        'name': layout.name,
        'description': layout.description,
        'target': '.'.join(layout.target.natural_key()),
        'parameters': layout.parameters,
        # 'num_descriptor_models': layout.descriptor_models.all().count()
    }

    return HttpResponseRest(request, result)


@RestLayoutId.def_auth_request(Method.PATCH, Format.JSON, content={
    "type": "object",
    "properties": {
        "label": Layout.LABEL_VALIDATOR_OPTIONAL
    },
},
                               perms={'descriptor.change_layout': _(
                                   'You are not allowed to modify a layout of descriptor')},
                               staff=True)
def patch_layout(request, layout_id):
    layout = get_object_or_404(Layout, id=int(layout_id))

    update = False
    result = {'id': layout.pk}

    label = request.data.get('label')

    if label is not None:
        update = True

        lang = translation.get_language()
        layout.set_label(lang, label)

        result['label'] = label

    if update:
        layout.save()

    return HttpResponseRest(request, result)


@RestLayoutSearch.def_auth_request(Method.GET, Format.JSON, ('filters',))
def search_layouts(request):
    """
    Filters the layouts of descriptors by name.
    """
    filters = json.loads(request.GET['filters'])

    layouts = None

    if 'name' in filters['fields']:
        if filters['method'] == 'ieq':
            layouts = Layout.objects.filter(name__iexact=filters['name'])
        elif filters['method'] == 'icontains':
            layouts = Layout.objects.filter(name__icontains=filters['name'])
    elif 'name_or_label' in filters['fields']:
        lang = translation.get_language()

        if filters['method'] == 'ieq':
            q_params = {"label__%s__iexact" % lang: filters['name']}
            layouts = Layout.objects.filter(Q(name__iexact=filters['name']) | Q(**q_params))
        elif filters['method'] == 'icontains':
            q_params = {"label__%s__icontains" % lang: filters['name']}
            layouts = Layout.objects.filter(Q(name__icontains=filters['name']) | Q(**q_params))

    if 'model' in filters['fields'] and 'model' in filters:
        app_name, model = filters['model'].split('.')
        content_type = get_object_or_404(ContentType, app_label=app_name, model=model)
        layouts = layouts.filter(target=content_type)

    # layouts = layouts.annotate(Count('descriptor_models'))
    layouts_list = []

    if layouts is not None:
        for layout in layouts:
            layouts_list.append({
                "id": layout.id,
                "name": layout.name,
                "label": layout.get_label(),
                # 'num_descriptor_models': layout.descriptor_models__count
            })

    response = {
        'items': layouts_list,
        'page': 1
    }

    return HttpResponseRest(request, response)


@RestLayoutIdPanel.def_auth_request(Method.GET, Format.JSON)
def list_descriptor_panels_for_layout(request, layout_id):
    """
    Returns a list of panels for a layout, ordered by position.
    """
    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = request.GET.get('cursor')
    # limit = results_per_page

    layout = get_object_or_404(Layout, id=int(layout_id))

    # if cursor:
    #     cursor = json.loads(cursor)
    #     cursor_position, cursor_id = cursor
    #     qs = DescriptorPanel.objects.filter(Q(layout=layout.id), Q(position__gt=cursor_position))
    # else:
    #     qs = DescriptorPanel.objects.filter(Q(layout=layout.id))

    # descriptor_models = qs.prefetch_related(
    #     'descriptor_model').order_by(
    #     'position').prefetch_related(
    #     'descriptor_model')[:limit]

    panels_list = []

    if layout.layout_content.get('panels'):
        i = 0
        for panel in layout.layout_content.get('panels'):
            lang = translation.get_language()
            panels_list.append({
                'id': i,
                'label': panel['label'].get(lang, "en"),
                'position': i,
            })
            i += 1

    if len(panels_list) > 0:
        # prev cursor (asc order)
        panel = panels_list[0]
        prev_cursor = (panel['position'], panel['id'])

        # next cursor (asc order)
        panel = panels_list[-1]
        next_cursor = (panel['position'], panel['id'])
    else:
        prev_cursor = None
        next_cursor = None

    results = {
        'perms': [],
        'items': panels_list,
        'prev': prev_cursor,
        'cursor': cursor,
        'next': next_cursor,
    }

    return HttpResponseRest(request, results)


@RestLayoutIdPanel.def_auth_request(Method.POST, Format.JSON, content={
    "type": "object",
    "properties": {
        "label": Layout.LABEL_VALIDATOR,
        # "position": {"type": "number"},
        # "descriptor_model": {"type": "number"},
    },
}, perms={
    'descriptor.change_layout': _('You are not allowed to modify a layout of descriptor'),
    # 'descriptor.add_descriptorpanel': _('You are not allowed to create a panel of descriptor'),
},
                                    staff=True)
def create_panel_for_layout(request, layout_id):
    # position = int(request.data['position'])
    lang = translation.get_language()

    layout = get_object_or_404(Layout, id=int(layout_id))

    if not layout.layout_content.get('panels'):
        layout.layout_content = {'panels': []}

    panel_list = layout.layout_content.get('panels')

    panel = {
        'descriptors': [],
        'label': {'fr': '', 'en': ''}
    }
    panel['label'][lang] = request.data['label']

    panel_list.append(panel)
    layout.save()

    result = {
        'id': len(panel_list) - 1,
        'label': panel['label'][lang],
        'position': len(panel_list) - 1
    }

    return HttpResponseRest(request, result)


@RestLayoutIdPanelId.def_auth_request(Method.DELETE, Format.JSON, perms={
    'descriptor.change_layout': _('You are not allowed to modify a layout of descriptor'),
}, staff=True)
def remove_panel_for_layout(request, layout_id, pan_id):
    layout = get_object_or_404(Layout, id=int(layout_id))
    panel_list = layout.layout_content.get('panels')

    # todo: check if descriptors in the panel are used in external panel conditions

    panel = panel_list[int(pan_id)]

    for lyt_descriptor in panel.get('descriptors'):

        for p in layout.layout_content.get('panels'):
            if p == panel:
                continue
            for d in p.get('descriptors'):
                if d.get('conditions'):
                    if d["conditions"].get('target_name') == lyt_descriptor.get('name'):
                        raise SuspiciousOperation(
                            _("the descriptor cannot be removed, because it is involved in a condition"))

        mdl_descriptor = Descriptor.objects.get(name=lyt_descriptor.get('name'))
        if mdl_descriptor.has_records(layout):
            raise SuspiciousOperation(_("Only unused descriptors can be removed, these descriptors have some records"))

    panel_list.remove(panel)
    layout.save()

    return HttpResponseRest(request, {})


@RestLayoutIdDescriptor.def_auth_request(Method.GET, Format.JSON, staff=True)
def list_descriptor(request, layout_id):
    """
    Returns a list of descriptors ordered by name.
    """
    panel_index = request.GET.get('panel_index')

    layout = get_object_or_404(Layout, id=int(layout_id))

    items_list = []

    i = 0
    if layout.layout_content.get('panels'):
        for panel in layout.layout_content.get('panels'):
            j = 0
            for panel_descriptor in panel.get('descriptors'):
                mdl_descriptor = get_object_or_404(Descriptor, name=panel_descriptor.get('name'))

                if (panel_index is not None and i == int(panel_index)) or (not panel_index):
                    items_list.append({
                        'id': mdl_descriptor.id,
                        'code': mdl_descriptor.code,
                        'name': mdl_descriptor.name,
                        'label': mdl_descriptor.get_label(),
                        'group_name': mdl_descriptor.group_name,
                        'position': j,
                        'panel_index': i,
                        'mandatory': panel_descriptor.get('mandatory', False),
                        'set_once': panel_descriptor.get('set_once', False),
                        'index': panel_descriptor.get('index', None),
                        'condition': panel_descriptor.get('conditions', None),
                        'format': mdl_descriptor.format
                    })
                j += 1
            i += 1

    results = {
        'perms': [],
        'items': items_list,
    }

    return HttpResponseRest(request, results)


# @RestLayoutIdDescriptorName.def_auth_request(Method.GET, Format.JSON, staff=True)
# def get_descriptor(request, layout_id, descriptor_name):
#     """
#     Returns a layout descriptor details.
#     """
#     # panel_index = request.GET.get('panel_index')
#     descriptor = request.GET.get('descriptor')
#
#     if descriptor.get('name'):
#         mdl_descriptor = get_object_or_404(Descriptor, name=descriptor.get('name'))
#
#
#     layout = get_object_or_404(Layout, id=int(layout_id))
#     layout.layout_content.get('panels')
#
#         panel.get('descriptors')[descriptor_pos]
#
#             if (panel_index is not None and i == int(panel_index)) or (not panel_index):
#                 items_list.append({
#                     'id': mdl_descriptor.id,
#                     'name': mdl_descriptor.name,
#                     'position': j,
#                     'panel_index': i,
#                     'label': mdl_descriptor.get_label(),
#                     'group_name': mdl_descriptor.group_name,
#                     'code': mdl_descriptor.code,
#                     'mandatory': panel_descriptor.get('mandatory', False),
#                     'set_once': panel_descriptor.get('set_once', False),
#                     'index': panel_descriptor.get('index', None)
#                 })
#             j += 1
#         i += 1
#
#     results = {
#         'perms': [],
#         'items': items_list,
#     }
#
#     return HttpResponseRest(request, results)


# @RestLayoutIdPanelIdDescriptor.def_auth_request(Method.GET, Format.JSON, staff=True)
@RestLayoutIdPanelId.def_auth_request(Method.GET, Format.JSON, staff=True)
def list_descriptor_for_panel(request, layout_id, pan_id):
    """
    Returns a list of type of descriptors ordered by name for a given layout panel.
    """
    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = request.GET.get('cursor')
    # limit = results_per_page

    layout = get_object_or_404(Layout, id=int(layout_id))
    panel = layout.layout_content.get('panels')[int(pan_id)]

    # if cursor:
    #     cursor = json.loads(cursor)
    #     cursor_position, cursor_id = cursor
    #     qs = panel.descriptor_model_types.filter(Q(position__gt=cursor_position))
    # else:
    #     qs = panel.descriptor_model_types.all()
    #
    # dmts = qs.order_by('position')[:limit]

    items_list = []
    i = 0
    for panel_descriptor in panel['descriptors']:
        mdl_descriptor = get_object_or_404(Descriptor, name=panel_descriptor.get('name'))

        items_list.append({
            'id': mdl_descriptor.id,
            'name': mdl_descriptor.name,
            'position': i,
            'label': mdl_descriptor.get_label(),
            'group_name': mdl_descriptor.group_name,
            'code': mdl_descriptor.code,
            'mandatory': panel_descriptor.get('mandatory', False),
            'set_once': panel_descriptor.get('set_once', False),
            'index': panel_descriptor.get('index', None)
        })
        i += 1

    if len(items_list) > 0:
        # prev cursor (asc order)
        obj = items_list[0]
        prev_cursor = (obj['position'], obj['id'])

        # next cursor (asc order)
        obj = items_list[-1]
        next_cursor = (obj['position'], obj['id'])
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


@RestLayoutIdDescriptorOrder.def_auth_request(Method.PUT, Format.JSON, content={
    "type": "object",
    "properties": {
        "current_position": {"type": "number"},
        "new_position": {"type": "number"},
        "current_panel": {"type": "number"},
        "new_panel": {"type": "number"},
    },
}, perms={
    'descriptor.change_layout': _(
        'You are not allowed to modify a layout of descriptor'),
    # 'descriptor.change_descriptormodel': _('You are not allowed to modify a model of descriptor'),
    # 'descriptor.change_descriptormodeltype': _('You are not allowed to modify a type of model of descriptor'),
},
                                              staff=True)
def reorder_descriptor_for_panel(request, layout_id):
    """
    Reorder descriptors according to the new position of one of the elements.
    """
    current_position = int(request.data['current_position'])
    current_panel = int(request.data['current_panel'])  # new
    new_position = int(request.data['new_position'])
    new_panel = int(request.data['new_panel'])  # new

    layout = get_object_or_404(Layout, id=int(layout_id))
    panel_list = layout.layout_content.get('panels')

    descriptor = panel_list[current_panel]['descriptors'].pop(current_position)
    panel_list[new_panel]['descriptors'].insert(new_position, descriptor)

    layout.save()

    return HttpResponseRest(request, {})


@RestLayoutIdPanelOrder.def_auth_request(Method.PUT, Format.JSON, content={
    "type": "object",
    "properties": {
        "descriptor_panel_id": {"type": "number"},
        "position": {"type": "number"},
    },
}, perms={
    'descriptor.change_layout': _(
        'You are not allowed to modify a layout of descriptor'),
    # 'descriptor.change_descriptorpanel': _('You are not allowed to modify a panel of descriptor'),
},
                                         staff=True)
def reorder_descriptor_panels_for_model(request, layout_id):
    """
    Reorder the panels for a layout of descriptors according to the new position of one of the elements.
    """

    current_position = int(request.data['descriptor_panel_id'])
    new_position = int(request.data['position'])

    layout = get_object_or_404(Layout, id=int(layout_id))
    # panel = layout.layout_content.get('panels')[current_position]

    panel_list = layout.layout_content.get('panels')

    panel = panel_list.pop(current_position)
    panel_list.insert(new_position, panel)

    layout.save()

    return HttpResponseRest(request, {})


@RestLayoutIdPanelIdDescriptorId.def_auth_request(
    Method.PATCH, Format.JSON, content={
        "type": "object",
        "properties": {
            "label": Descriptor.LABEL_VALIDATOR_OPTIONAL,
            "mandatory": {"type": "boolean", "required": False},
            "set_once": {"type": "boolean", "required": False}
        }
    },
    perms={
        'descriptor.change_layout': _('You are not allowed to modify a layout of descriptor'),
        # 'descriptor.change_descriptorpanel': _('You are not allowed to modify a panel of descriptor'),
    },
    staff=True)
def modify_descriptor_panel_for_layout(request, layout_id, pan_id, desc_id):
    label = request.data.get('label')
    mandatory = request.data.get('mandatory')
    set_once = request.data.get('set_once')

    layout = get_object_or_404(Layout, id=int(layout_id))
    panel = layout.layout_content.get('panels')[int(pan_id)]
    descriptor = panel.get('descriptors')[int(desc_id)]

    descriptor['label'] = label

    if mandatory is False:
        descriptor['mandatory'] = False
    elif mandatory is True:
        if descriptor.get('conditions'):
            raise SuspiciousOperation(_(
                "Cyclic condition detected. You cannot define this condition or you must remove the condition on the target"))
        else:
            descriptor['mandatory'] = True

    if set_once is True or set_once is False:
        descriptor['set_once'] = set_once

    layout.save()

    return HttpResponseRest(request, {})


@RestLayoutIdPanelIdDescriptorId.def_auth_request(
    Method.DELETE, Format.JSON, perms={
        'descriptor.change_layout': _('You are not allowed to modify a layout of descriptor'),
    },
    staff=True)
def remove_descriptor_for_layout(request, layout_id, pan_id, desc_id):
    layout = get_object_or_404(Layout, id=int(layout_id))
    panel = layout.layout_content.get('panels')[int(pan_id)]
    lyt_descriptor = panel.get('descriptors')[int(desc_id)]

    for p in layout.layout_content.get('panels'):
        for d in p.get('descriptors'):
            if d.get('conditions'):
                if d["conditions"].get('target_name') == lyt_descriptor.get('name'):
                    raise SuspiciousOperation(
                        _("the descriptor cannot be removed, because it is involved in a condition"))

    mdl_descriptor = Descriptor.objects.get(name=lyt_descriptor.get('name'))
    if mdl_descriptor.has_records(layout):
        raise SuspiciousOperation(_("Only unused descriptors can be removed, this descriptor has some records"))

    panel.get('descriptors').remove(lyt_descriptor)
    layout.save()

    return HttpResponseRest(request, {})


@RestLayoutIdPanelIdDescriptor.def_auth_request(Method.POST, Format.JSON, perms={
    'descriptor.change_layout': _('You are not allowed to modify a layout of descriptor'),
}, staff=True)
def add_descriptor_for_layout(request, layout_id, pan_id):
    descriptor_id = request.data.get('id')
    descriptor_name = request.data.get('name')

    new_descriptor = None
    if descriptor_id:
        new_descriptor = get_object_or_404(Descriptor, id=int(descriptor_id))
    elif descriptor_name:
        new_descriptor = get_object_or_404(Descriptor, name=descriptor_name)

    # Check if descriptor already exist in this layout
    layout = get_object_or_404(Layout, id=int(layout_id))
    panels = layout.layout_content.get('panels')
    for panel in panels:
        for descriptor in panel.get('descriptors'):
            if new_descriptor.name == descriptor.get('name'):
                raise ValidationError(
                    'Descriptor ' + new_descriptor.code + ':' + new_descriptor.name + ' already exist in this layout.')

    d = {
        'name': new_descriptor.name,
        'mandatory': False,
        'set_once': False
    }

    panels[int(pan_id)]['descriptors'].append(d)
    layout.save()

    d['position'] = len(panels[int(pan_id)]['descriptors']) - 1
    d['id'] = new_descriptor.id

    return HttpResponseRest(request, d)


@RestLayoutIdLabel.def_auth_request(Method.GET, Format.JSON)
def get_all_labels_of_layout(request, layout_id):
    """
    Returns labels for each language related to the user interface.
    """
    layout = get_object_or_404(Layout, id=int(layout_id))

    label_dict = layout.label

    # complete with missing languages
    for lang, lang_label in InterfaceLanguages.choices():
        if lang not in label_dict:
            label_dict[lang] = ""

    results = label_dict

    return HttpResponseRest(request, results)


@RestLayoutIdLabel.def_auth_request(
    Method.PUT, Format.JSON, content={
        "type": "object",
        "additionalProperties": Layout.LABEL_VALIDATOR
    },
    perms={
        'descriptor.change_layout': _(
            'You are not allowed to modify a layout of descriptor'),
    },
    staff=True)
def change_all_labels_of_layout(request, layout_id):
    """
    Changes all the label, for each language related to the user interface.
    Returns only the local label.
    """
    layout = get_object_or_404(Layout, id=int(layout_id))

    labels = request.data

    languages_values = [lang[0] for lang in InterfaceLanguages.choices()]

    for lang, label in labels.items():
        if lang not in languages_values:
            raise SuspiciousOperation(_("Unsupported language identifier"))

    layout.label = labels

    layout.update_field('label')
    layout.save()

    result = {
        'label': layout.get_label()
    }

    return HttpResponseRest(request, result)


@RestLayoutIdPanelIdLabel.def_auth_request(Method.GET, Format.JSON)
def get_all_labels_of_layout(request, layout_id, pan_id):
    """
    Returns labels for each language related to the user interface.
    """
    layout = get_object_or_404(Layout, id=int(layout_id))
    results = {}

    if layout.layout_content.get('panels'):
        panel = layout.layout_content.get('panels')[int(pan_id)]

        label_dict = panel.get('label')

        # complete with missing languages
        for lang, lang_label in InterfaceLanguages.choices():
            if lang not in label_dict:
                label_dict[lang] = ""

        results = label_dict

    return HttpResponseRest(request, results)


@RestLayoutIdPanelIdLabel.def_auth_request(
    Method.PUT, Format.JSON, content={
        "type": "object",
        "additionalProperties": Layout.LABEL_VALIDATOR
    },
    perms={
        'descriptor.change_layout': _(
            'You are not allowed to modify a layout of descriptor'),
    },
    staff=True)
def change_all_labels_of_layout(request, layout_id, pan_id):
    """
    Changes all the label, for each language related to the user interface.
    Returns only the local label.
    """
    layout = get_object_or_404(Layout, id=int(layout_id))

    labels = request.data

    languages_values = [lang[0] for lang in InterfaceLanguages.choices()]

    for lang, label in labels.items():
        if lang not in languages_values:
            raise SuspiciousOperation(_("Unsupported language identifier"))

    result = {}

    if layout.layout_content.get('panels'):
        panel = layout.layout_content.get('panels')[int(pan_id)]

        panel['label'] = labels

        layout.save()

        result = {
            'label': layout.get_label()
        }

    return HttpResponseRest(request, result)


@RestLayoutIdPanelIdDescriptorIdCondition.def_auth_request(Method.GET, Format.JSON)
def get_condition(request, layout_id, pan_id, desc_id):
    layout = get_object_or_404(Layout, id=int(layout_id))

    try:
        panel = layout.layout_content.get('panels')[int(pan_id)]
        descriptor = panel.get('descriptors')[int(desc_id)]
        condition = descriptor.get('conditions')

        result = {
            'condition': condition.get('condition'),
            'target_name': condition.get('target_name'),
            'values': condition.get('values')
        }

    except AttributeError:
        result = None

    return HttpResponseRest(request, result)


@RestLayoutIdPanelIdDescriptorIdCondition.def_auth_request(
    Method.POST, Format.JSON, content={
        "type": "object",
        "properties": {
            "target": {"type": "integer"},
            "condition": {"type": "integer", "minValue": 0, "maxValue": 3},
            "values": {"type": "any", "required": False}
        }
    }, perms={
        'descriptor.change_layout': _(
            'You are not allowed to modify a layout of descriptor'),
    },
    staff=True)
def create_condition(request, layout_id, pan_id, desc_id):
    """
    Create the unique condition (for now) of the descriptor.
    """
    target_id = int(request.data['target'])

    layout = get_object_or_404(Layout, id=int(layout_id))
    target = get_object_or_404(Descriptor, id=target_id)

    panel = layout.layout_content.get('panels')[int(pan_id)]
    descriptor = panel.get('descriptors')[int(desc_id)]

    if descriptor.get('mandatory'):
        raise SuspiciousOperation(_(
            "It is not possible to define a condition on a required type of model of descriptor"))

    # check if there is a cyclic condition
    target_position = layout.get_position_by_name(target.name)

    if layout.layout_content.get('panels')[target_position['panel']].get('descriptors')[
        target_position['position']].get('conditions') and \
            layout.layout_content.get('panels')[target_position['panel']].get('descriptors')[
                target_position['position']].get('conditions').get('target_name') == descriptor.get('name'):
        raise SuspiciousOperation(_(
            "Cyclic condition detected. You cannot define this condition or you must remove the condition on the target"))

    condition = DescriptorCondition(request.data['condition'])

    descriptor['conditions'] = {
        'condition': condition.value,
        'target_name': target.name,
    }

    values = request.data['values']

    if values:
        descriptor.get('conditions')['values'] = values

    # validate the values[0]
    if condition == DescriptorCondition.EQUAL or condition == DescriptorCondition.NOT_EQUAL:
        DescriptorFormatTypeManager.validate(target.format, values, target)

    layout.save()

    result = {
        'condition': descriptor['conditions'].get('condition'),
        'target': descriptor['conditions'].get('target_name'),
        'values': values
    }

    return HttpResponseRest(request, result)


@RestLayoutIdPanelIdDescriptorIdCondition.def_auth_request(
    Method.PUT, Format.JSON, content={
        "type": "object",
        "properties": {
            "target": {"type": "integer"},
            "condition": {"type": "integer", "minValue": 0, "maxValue": 3},
            "values": {"type": "any", "required": False}
        }
    }, perms={
        'descriptor.change_layout': _(
            'You are not allowed to modify a layout of descriptor'),
    },
    staff=True)
def modify_condition(request, layout_id, pan_id, desc_id):
    """
    Modify the unique condition (for now) of the descriptor.
    """
    target_id = int(request.data['target'])

    layout = get_object_or_404(Layout, id=int(layout_id))
    target = get_object_or_404(Descriptor, id=target_id)

    panel = layout.layout_content.get('panels')[int(pan_id)]
    descriptor = panel.get('descriptors')[int(desc_id)]

    # check if condition exist
    if not descriptor.get('conditions'):
        raise AttributeError

    # check if there is a cyclic condition
    target_position = layout.get_position_by_name(target.name)

    if layout.layout_content.get('panels')[target_position.get('panel')].get('descriptors')[
        target_position.get('position')].get('conditions') and \
            layout.layout_content.get('panels')[target_position.panel].get('descriptors')[target_position.position].get(
                'conditions').get('target_name') == descriptor.get('name'):
        raise SuspiciousOperation(_(
            "Cyclic condition detected. You cannot define this condition or you must remove the condition on the target"))

    condition = DescriptorCondition(request.data['condition'])

    descriptor.get('conditions')['condition'] = condition.value
    descriptor.get('conditions')['target_name'] = target.name

    values = request.data['values']

    if values:
        descriptor.get('conditions')['values'] = values

    # validate the values[0]
    if condition == DescriptorCondition.EQUAL or condition == DescriptorCondition.NOT_EQUAL:
        DescriptorFormatTypeManager.validate(target.format, values, target)

    layout.save()

    result = {
        'condition': descriptor['conditions'].get('condition'),
        'target': descriptor['conditions'].get('target_name'),
        'values': values
    }

    return HttpResponseRest(request, result)


@RestLayoutIdPanelIdDescriptorIdCondition.def_auth_request(
    Method.DELETE, Format.JSON,
    perms={
        'descriptor.change_layout': _(
            'You are not allowed to modify a layout of descriptor'),
    },
    staff=True)
def delete_condition(request, layout_id, pan_id, desc_id):
    """
    Delete the unique condition (for now) of the descriptor.
    """
    layout = get_object_or_404(Layout, id=int(layout_id))
    panel = layout.layout_content.get('panels')[int(pan_id)]
    descriptor = panel.get('descriptors')[int(desc_id)]

    if descriptor.get('conditions'):
        del descriptor['conditions']
        layout.save()

    return HttpResponseRest(request, {})
