# -*- coding: utf-8; -*-
#
# @file layout.py
# @brief coll-gate descriptor module, descriptor layout
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2016-09-01
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

import json

from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import SuspiciousOperation
from django.db.models import Q, Count
from django.shortcuts import get_object_or_404
from django.utils import translation
from django.utils.translation import ugettext_lazy as _

from descriptor.layouttype import LayoutTypeManager
from igdectk.common.helpers import int_arg
from igdectk.rest import Format, Method
from igdectk.rest.response import HttpResponseRest

from main.models import InterfaceLanguages
from .descriptor import RestDescriptor
from .models import Layout
# from .models import DescriptorModel, DescriptorPanel, Layout, DescriptorModelTypeCondition, \
#     DescriptorModelType


class RestLayout(RestDescriptor):
    regex = r'^layout/$'
    suffix = 'layout'


class RestLayoutCount(RestLayout):
    regex = r'^count/$'
    suffix = 'count'


class RestLayoutValues(RestLayout):
    regex = r'^values/$'
    suffix = 'values'


class RestLayoutForDescribable(RestLayout):
    regex = r'^for-describable/(?P<content_type_name>[a-zA-Z\.-]+)/$'
    suffix = 'for-describable'


class RestLayoutSearch(RestLayout):
    regex = r'^search/$'
    suffix = 'search'


class RestLayoutId(RestLayout):
    regex = r'^(?P<layout_id>[0-9]+)/$'
    suffix = 'id'


class RestLayoutIdLabel(RestLayoutId):
    regex = r'^label/$'
    suffix = 'label'


class RestLayoutIdPanel(RestLayoutId):
    regex = r'^panel/$'
    suffix = 'panel'


class RestLayoutIdLayout(RestLayoutId):
    regex = r'^layout/$'
    suffix = 'layout'


class RestLayoutIdPanelOrder(RestLayoutIdPanel):
    regex = r'^order/$'
    suffix = 'order'


class RestLayoutIdPanelId(RestLayoutIdPanel):
    regex = r'^(?P<pan_id>[0-9]+)/$'
    suffix = 'id'


class RestLayoutIdPanelIdLabel(RestLayoutIdPanelId):
    regex = r'^label/$'
    suffix = 'label'


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
            'layout_content': layout.layout_content
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


@RestLayout.def_auth_request(
    Method.POST, Format.JSON, content={
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
        'num_descriptor_models': 0
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

    layouts = []

    for layout in layouts:
        layouts.append({
            'id': layout.id,
            'name': layout.name,
            'label': layout.get_label(),
            'parameters': layout.parameters
        })

    return HttpResponseRest(request, layouts)


@RestLayoutId.def_auth_request(Method.GET, Format.JSON)
def get_layout(request, layout_id):
    layout = get_object_or_404(Layout, id=int(layout_id))

    result = {
        'id': layout.id,
        'name': layout.name,
        'description': layout.description,
        'target': '.'.join(layout.target.natural_key()),
        'parameters': layout.parameters,
        'num_descriptor_models': layout.descriptor_models.all().count()
    }

    return HttpResponseRest(request, result)


@RestLayoutId.def_auth_request(
    Method.DELETE, Format.JSON,
    perms={'descriptor.remove_layout': _('You are not allowed to remove a layout of descriptor')},
    staff=True)
def delete_layout(request, layout_id):
    layout = get_object_or_404(Layout, id=int(layout_id))

    if layout.descriptor_models.all().count() > 0:
        raise SuspiciousOperation(
            _('It is not possible to remove a layout of descriptor that contains models of descriptor'))

    if layout.in_usage():
        raise SuspiciousOperation(_("There is some data using the layout of descriptor"))

    layout.delete()

    return HttpResponseRest(request, {})


@RestLayoutId.def_auth_request(
    Method.PUT, Format.JSON, content={
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
    perms={'descriptor.change_layout': _('You are not allowed to modify a layout of descriptor')},
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
        'num_descriptor_models': layout.descriptor_models.all().count()
    }

    return HttpResponseRest(request, result)


@RestLayoutId.def_auth_request(
    Method.PATCH, Format.JSON, content={
        "type": "object",
        "properties": {
            "label": Layout.LABEL_VALIDATOR_OPTIONAL
        },
    },
    perms={'descriptor.change_layout': _('You are not allowed to modify a layout of descriptor')},
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


@RestLayoutIdLayout.def_auth_request(Method.GET, Format.JSON)
# def get_layout_layout(request, layout_id):
#     """
#     Return the structure of panels of descriptors with descriptor models, descriptors model types, descriptor type.
#     """
#     layout = get_object_or_404(Layout, id=int(layout_id))
#
#     dps = DescriptorPanel.objects.select_related('descriptor_model').filter(layout=layout).order_by('position')
#
#     panels = []
#
#     for panel in dps:
#         descriptor_model = panel.descriptor_model
#
#         dmts = []
#
#         for dmt in descriptor_model.descriptor_model_types.all().order_by('position').select_related('descriptor_type'):
#             descriptor_type = dmt.descriptor_type
#
#             # values are loaded on demand (displaying the panel or opening the dropdown)
#             format_type = descriptor_type.format
#
#             conditions = DescriptorModelTypeCondition.objects.filter(descriptor_model_type_id=dmt.id)
#
#             if conditions.exists():
#                 dmtc = conditions[0]
#
#                 condition = {
#                     'defined': True,
#                     'condition': dmtc.condition,
#                     'target': dmtc.target_id,
#                     'values': dmtc.values
#                 }
#             else:
#                 condition = {
#                     'defined': False,
#                     'condition': 0,
#                     'target': 0,
#                     'values': None
#                 }
#
#             dmts.append({
#                 'id': dmt.id,
#                 'name': dmt.name,
#                 'label': dmt.get_label(),
#                 'condition': condition,
#                 'mandatory': dmt.mandatory,
#                 'set_once': dmt.set_once,
#                 'descriptor_type': {
#                     'id': descriptor_type.id,
#                     'group': descriptor_type.group_id,
#                     'code': descriptor_type.code,
#                     'format': format_type
#                 }
#             })
#
#         panels.append({
#             'id': panel.id,
#             'position': panel.position,
#             'label': panel.get_label(),
#             'descriptor_model': {
#                 'id': descriptor_model.id,
#                 'name': descriptor_model.name,
#                 'descriptor_model_types': dmts
#             }
#         })
#
#     results = {
#         'id': layout.id,
#         'label': layout.get_label(),
#         'description': layout.description,
#         'target': ".".join(layout.target.natural_key()),
#         'parameters': layout.parameters,
#         'panels': panels
#     }
#
#     return HttpResponseRest(request, results)


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

    layouts = layouts.annotate(Count('descriptor_models'))
    layouts_list = []

    if layouts is not None:
        for layout in layouts:
            layouts_list.append({
                "id": layout.id,
                "name": layout.name,
                "label": layout.get_label(),
                'num_descriptor_models': layout.descriptor_models__count
            })

    response = {
        'items': layouts_list,
        'page': 1
    }

    return HttpResponseRest(request, response)


# @RestLayoutIdPanel.def_auth_request(Method.GET, Format.JSON)
# def list_descriptor_panels_for_layout(request, layout_id):
#     """
#     Returns a list of panels for a metal-model of descriptors, ordered by position.
#     """
#     results_per_page = int_arg(request.GET.get('more', 30))
#     cursor = request.GET.get('cursor')
#     limit = results_per_page
#
#     layout = get_object_or_404(Layout, id=int(layout_id))
#
#     if cursor:
#         cursor = json.loads(cursor)
#         cursor_position, cursor_id = cursor
#         qs = DescriptorPanel.objects.filter(Q(layout=layout.id), Q(position__gt=cursor_position))
#     else:
#         qs = DescriptorPanel.objects.filter(Q(layout=layout.id))
#
#     descriptor_models = qs.prefetch_related(
#         'descriptor_model').order_by(
#         'position').prefetch_related(
#         'descriptor_model')[:limit]
#
#     panels_list = []
#
#     for panel in descriptor_models:
#         panels_list.append({
#             'id': panel.id,
#             'label': panel.get_label(),
#             'position': panel.position,
#             'descriptor_model': panel.descriptor_model.id,
#             'descriptor_model_name': panel.descriptor_model.name,
#             'descriptor_model_verbose_name': panel.descriptor_model.verbose_name
#         })
#
#     if len(panels_list) > 0:
#         # prev cursor (asc order)
#         panel = panels_list[0]
#         prev_cursor = (panel['position'], panel['id'])
#
#         # next cursor (asc order)
#         panel = panels_list[-1]
#         next_cursor = (panel['position'], panel['id'])
#     else:
#         prev_cursor = None
#         next_cursor = None
#
#     results = {
#         'perms': [],
#         'items': panels_list,
#         'prev': prev_cursor,
#         'cursor': cursor,
#         'next': next_cursor,
#     }
#
#     return HttpResponseRest(request, results)
#
#
# @RestLayoutIdPanel.def_auth_request(
#     Method.POST, Format.JSON, content={
#         "type": "object",
#         "properties": {
#             "label": DescriptorPanel.LABEL_VALIDATOR,
#             "position": {"type": "number"},
#             "descriptor_model": {"type": "number"},
#         },
#     },
#     perms={
#         'descriptor.change_layout': _('You are not allowed to modify a layout of descriptor'),
#         'descriptor.add_descriptorpanel': _('You are not allowed to create a panel of descriptor'),
#     },
#     staff=True)
# def create_descriptor_panel_for_layout(request, layout_id):
#     position = int(request.data['position'])
#
#     lang = translation.get_language()
#
#     layout = get_object_or_404(Layout, id=int(layout_id))
#
#     dm_id = int(request.data['descriptor_model'])
#     dm = get_object_or_404(DescriptorModel, id=dm_id)
#
#     if DescriptorPanel.objects.filter(Q(layout=layout.id), Q(descriptor_model=dm.id)).exists():
#         raise SuspiciousOperation(
#             _("A panel of descriptor for this model already exists into this layout of descriptor"))
#
#     dp = DescriptorPanel()
#
#     dp.set_label(lang, request.data['label'])
#     dp.position = position
#     dp.layout = layout
#     dp.descriptor_model = dm
#
#     dp.full_clean()
#     dp.save()
#
#     # rshift of 1 others descriptor_model
#     dps = DescriptorPanel.objects.filter(Q(layout=layout.id), Q(position__gte=position)).order_by(
#         'position')
#
#     for ldp in dps:
#         if ldp.id != dp.id:
#             new_position = ldp.position + 1
#             ldp.position = new_position
#             ldp.save()
#
#     # create related indexes
#     dmts = dm.descriptor_model_types.all()
#     for dmt in dmts:
#         content_type_model = layout.target.model_class()
#         dmt.create_or_drop_index(content_type_model)
#
#     result = {
#         'id': dp.id,
#         'label': dp.get_label(),
#         'position': dp.position,
#         'descriptor_model': dm.id,
#         'descriptor_model_name': dm.name,
#         'descriptor_model_verbose_name': dm.verbose_name
#     }
#
#     return HttpResponseRest(request, result)
#
#
# @RestLayoutIdPanelId.def_auth_request(Method.GET, Format.JSON)
# def get_descriptor_panel_for_layout(request, layout_id, pan_id):
#     panel = get_object_or_404(DescriptorPanel, id=int(pan_id), layout=int(layout_id))
#
#     result = {
#         'id': panel.id,
#         'label': panel.get_label(),
#         'position': panel.position,
#         'descriptor_model': panel.descriptor_model.id,
#         'descriptor_model_name': panel.descriptor_model.name,
#         'descriptor_model_verbose_name': panel.descriptor_model.verbose_name
#     }
#
#     return HttpResponseRest(request, result)
#
#
# @RestLayoutIdPanelOrder.def_auth_request(Method.PUT, Format.JSON, content={
#         "type": "object",
#         "properties": {
#             "descriptor_panel_id": {"type": "number"},
#             "position": {"type": "number"},
#         },
#     },
#     perms={
#         'descriptor.change_layout': _('You are not allowed to modify a layout of descriptor'),
#         'descriptor.change_descriptorpanel': _('You are not allowed to modify a panel of descriptor'),
#     },
#     staff=True)
# def reorder_descriptor_panels_for_model(request, layout_id):
#     """
#     Reorder the panels for a layout of descriptors according to the new position of one of the elements.
#     """
#     dp_id = int(request.data['descriptor_panel_id'])
#     position = int(request.data['position'])
#
#     layout = get_object_or_404(Layout, id=int(layout_id))
#     dp_ref = get_object_or_404(DescriptorPanel, layout=layout, id=dp_id)
#
#     dp_list = []
#
#     if position < dp_ref.position:
#         dps = layout.panels.filter(Q(position__gte=position)).order_by('position')
#
#         for dp in dps:
#             if dp.id != dp_id:
#                 dp_list.append(dp)
#
#         dp_ref.position = position
#         dp_ref.save()
#
#         next_position = position + 1
#
#         for dp in dp_list:
#             dp.position = next_position
#             dp.save()
#
#             next_position += 1
#     else:
#         dps = layout.panels.filter(Q(position__lte=position)).order_by('position')
#
#         for dp in dps:
#             if dp.id != dp_id:
#                 dp_list.append(dp)
#
#         dp_ref.position = position
#         dp_ref.save()
#
#         next_position = 0
#
#         for dp in dp_list:
#             dp.position = next_position
#             dp.save()
#
#             next_position += 1
#
#     return HttpResponseRest(request, {})
#
#
# @RestLayoutIdPanelId.def_auth_request(
#     Method.PATCH, Format.JSON, content={
#         "type": "object",
#         "properties": {
#             "label": DescriptorPanel.LABEL_VALIDATOR_OPTIONAL
#         }
#     },
#     perms={
#         'descriptor.change_layout': _('You are not allowed to modify a layout of descriptor'),
#         'descriptor.change_descriptorpanel': _('You are not allowed to modify a panel of descriptor'),
#     },
#     staff=True)
# def modify_descriptor_panel_for_layout(request, layout_id, pan_id):
#     label = request.data.get('label')
#
#     panel = get_object_or_404(DescriptorPanel, id=int(pan_id), layout_id=int(layout_id))
#
#     update = False
#     result = {'id': panel.pk}
#
#     if label is not None:
#         update = True
#
#         lang = translation.get_language()
#         panel.set_label(lang, label)
#         panel.full_clean()
#
#         result['label'] = label
#
#     if update:
#         panel.save()
#
#     return HttpResponseRest(request, result)
#
#
# @RestLayoutIdPanelId.def_auth_request(
#     Method.DELETE, Format.JSON,
#     perms={
#         'descriptor.change_layout': _('You are not allowed to modify a layout of descriptor'),
#         'descriptor.delete_descriptorpanel': _('You are not allowed to remove a panel of descriptor'),
#     },
#     staff=True)
# def remove_descriptor_panel_of_layout(request, layout_id, pan_id):
#     layout = get_object_or_404(Layout, id=int(layout_id))
#
#     if layout.in_usage():
#         raise SuspiciousOperation(_('There is some entities attached to this panel'))
#
#     panel = get_object_or_404(DescriptorPanel, id=int(pan_id), layout=layout)
#
#     # drop related indexes
#     layouts = panel.descriptor_model.descriptor_model_types.all().values_list("id", flat=True)
#     dmts = DescriptorModelType.objects.filter(id__in=layouts)
#
#     for dmt in dmts:
#         content_type_model = layout.target.model_class()
#
#         # drop only if not used by another layout
#         if dmt.count_index_usage(layout.target) <= 1:
#             dmt.drop_index(content_type_model)
#
#     position = panel.position
#     panel.delete()
#
#     # reorder following panels
#     dps = layout.panels.filter(position__gt=position).order_by('position')
#
#     for panel in dps:
#         new_position = panel.position - 1
#         panel.position = new_position
#         panel.save()
#
#     return HttpResponseRest(request, {})
#
#
# @RestLayoutIdLabel.def_auth_request(Method.GET, Format.JSON)
# def get_all_labels_of_layout(request, layout_id):
#     """
#     Returns labels for each language related to the user interface.
#     """
#     layout = get_object_or_404(Layout, id=int(layout_id))
#
#     label_dict = layout.label
#
#     # complete with missing languages
#     for lang, lang_label in InterfaceLanguages.choices():
#         if lang not in label_dict:
#             label_dict[lang] = ""
#
#     results = label_dict
#
#     return HttpResponseRest(request, results)
#
#
# @RestLayoutIdLabel.def_auth_request(
#     Method.PUT, Format.JSON, content={
#         "type": "object",
#         "additionalProperties": DescriptorPanel.LABEL_VALIDATOR
#     },
#     perms={
#         'descriptor.change_layout': _('You are not allowed to modify a layout of descriptor'),
#     },
#     staff=True)
# def change_all_labels_of_layout(request, layout_id):
#     """
#     Changes all the label, for each language related to the user interface.
#     Returns only the local label.
#     """
#     layout = get_object_or_404(Layout, id=int(layout_id))
#
#     labels = request.data
#
#     languages_values = [lang[0] for lang in InterfaceLanguages.choices()]
#
#     for lang, label in labels.items():
#         if lang not in languages_values:
#             raise SuspiciousOperation(_("Unsupported language identifier"))
#
#     layout.label = labels
#
#     layout.update_field('label')
#     layout.save()
#
#     result = {
#         'label': layout.get_label()
#     }
#
#     return HttpResponseRest(request, result)
#
#
# @RestLayoutIdPanelIdLabel.def_auth_request(Method.GET, Format.JSON)
# def get_all_labels_of_layout(request, layout_id, pan_id):
#     """
#     Returns labels for each language related to the user interface.
#     """
#     dp = get_object_or_404(DescriptorPanel, id=int(pan_id), layout=int(layout_id))
#
#     label_dict = dp.label
#
#     # complete with missing languages
#     for lang, lang_label in InterfaceLanguages.choices():
#         if lang not in label_dict:
#             label_dict[lang] = ""
#
#     results = label_dict
#
#     return HttpResponseRest(request, results)
#
#
# @RestLayoutIdPanelIdLabel.def_auth_request(
#     Method.PUT, Format.JSON, content={
#         "type": "object",
#         "additionalProperties": DescriptorPanel.LABEL_VALIDATOR
#     },
#     perms={
#         'descriptor.change_layout': _('You are not allowed to modify a layout of descriptor'),
#         'descriptor.change_descriptorpanel': _('You are not allowed to modify a panel of descriptor'),
#     },
#     staff=True)
# def change_all_labels_of_descriptor_panel(request, layout_id, pan_id):
#     """
#     Changes all the label, for each language related to the user interface.
#     Returns only the local label.
#     """
#     dp = get_object_or_404(DescriptorPanel, id=int(pan_id), layout_id=int(layout_id))
#
#     labels = request.data
#
#     languages_values = [lang[0] for lang in InterfaceLanguages.choices()]
#
#     for lang, label in labels.items():
#         if lang not in languages_values:
#             raise SuspiciousOperation(_("Unsupported language identifier"))
#
#     dp.label = labels
#
#     dp.update_field('label')
#     dp.save()
#
#     result = {
#         'label': dp.get_label()
#     }
#
#     return HttpResponseRest(request, result)
