# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
coll-gate descriptor module, descriptor meta-model
"""
import json

from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import SuspiciousOperation
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import translation
from django.utils.translation import ugettext_lazy as _

from igdectk.common.helpers import int_arg
from igdectk.rest import Format, Method
from igdectk.rest.response import HttpResponseRest

from main.models import InterfaceLanguages
from .descriptor import RestDescriptor
from .models import DescriptorModel, DescriptorPanel, DescriptorMetaModel


class RestDescriptorMetaModel(RestDescriptor):
    regex = r'^meta-model/$'
    suffix = 'descriptor-meta-model'


class RestDescriptorMetaModelSearch(RestDescriptorMetaModel):
    regex = r'^search/$'
    suffix = 'search'


class RestDescriptorMetaModelId(RestDescriptorMetaModel):
    regex = r'^(?P<id>[0-9]+)/$'
    suffix = 'id'


class RestDescriptorMetaModelIdLabel(RestDescriptorMetaModelId):
    regex = r'^label/$'
    suffix = 'label'


class RestDescriptorMetaModelIdPanel(RestDescriptorMetaModelId):
    regex = r'^panel/$'
    suffix = 'panel'


class RestDescriptorMetaModelIdPanelOrder(RestDescriptorMetaModelIdPanel):
    regex = r'^order/$'
    suffix = 'order'


class RestDescriptorMetaModelIdPanelId(RestDescriptorMetaModelIdPanel):
    regex = r'^(?P<pid>[0-9]+)/$'
    suffix = 'id'


class RestDescriptorMetaModelIdPanelIdLabel(RestDescriptorMetaModelIdPanelId):
    regex = r'^label/$'
    suffix = 'label'


@RestDescriptorMetaModel.def_auth_request(Method.GET, Format.JSON)
def list_descriptor_meta_models(request):
    """
    Returns a list of metal-models of descriptors ordered by name.
    """
    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = request.GET.get('cursor')
    limit = results_per_page

    if cursor:
        cursor_name, cursor_id = cursor.split('/')
        qs = DescriptorMetaModel.objects.filter(Q(name__gt=cursor_name))
    else:
        qs = DescriptorMetaModel.objects.all()

    dmms = qs.order_by('name')[:limit]

    dmms_list = []

    for dmm in dmms:
        dmms_list.append({
            'id': dmm.id,
            'name': dmm.name,
            'label': dmm.get_label(),
            'description': dmm.description,
            'target': '.'.join(dmm.target.natural_key()),
            'num_descriptor_models': dmm.descriptor_models.all().count()
        })

    if len(dmms_list) > 0:
        # prev cursor (asc order)
        dmm = dmms_list[0]
        prev_cursor = "%s/%s" % (dmm['name'], dmm['id'])

        # next cursor (asc order)
        dmm = dmms_list[-1]
        next_cursor = "%s/%s" % (dmm['name'], dmm['id'])
    else:
        prev_cursor = None
        next_cursor = None

    results = {
        'perms': [],
        'items': dmms_list,
        'prev': prev_cursor,
        'cursor': cursor,
        'next': next_cursor,
    }

    return HttpResponseRest(request, results)


@RestDescriptorMetaModel.def_auth_request(
    Method.POST, Format.JSON, content={
        "type": "object",
        "properties": {
            "name": {"type": "string", 'minLength': 3, 'maxLength': 32},
            "label": {"type": "string", 'minLength': 3, 'maxLength': 64},
            "target": {"type": "string", 'minLength': 1, 'maxLength': 128},
            "description": {"type": "string", 'minLength': 0, 'maxLength': 1024, 'blank': True}
        },
    },
    perms={'descriptor.add_descriptormetamodel': _('You are not allowed to create a meta-model of descriptor')},
    staff=True)
def create_descriptor_meta_model(request):
    app_label, model = request.data['target'].split('.')

    content_type = get_object_or_404(ContentType, app_label=app_label, model=model)

    lang = translation.get_language()

    dmm = DescriptorMetaModel()

    dmm.name = request.data['name']
    dmm.set_label(lang, request.data['label'])
    dmm.description = request.data['description']
    dmm.target = content_type

    dmm.full_clean()
    dmm.save()

    result = {
        'id': dmm.id,
        'name': dmm.name,
        'label': dmm.get_label(),
        'description': dmm.description,
        'target': '.'.join(content_type.natural_key()),
        'num_descriptor_models': 0
    }

    return HttpResponseRest(request, result)


@RestDescriptorMetaModelId.def_auth_request(Method.GET, Format.JSON)
def get_descriptor_meta_model(request, id):
    dmm_id = int(id)

    dmm = get_object_or_404(DescriptorMetaModel, id=dmm_id)

    result = {
        'id': dmm.id,
        'name': dmm.name,
        'description': dmm.description,
        'target': '.'.join(dmm.target.natural_key()),
        'num_descriptor_models': dmm.descriptor_models.all().count()
    }

    return HttpResponseRest(request, result)


@RestDescriptorMetaModelId.def_auth_request(
    Method.DELETE, Format.JSON,
    perms={'descriptor.remove_descriptormetamodel': _('You are not allowed to remove a meta-model of descriptor')},
    staff=True)
def delete_descriptor_meta_model(request, id):
    dmm_id = int(id)

    dmm = get_object_or_404(DescriptorMetaModel, id=dmm_id)

    if dmm.descriptor_models.all().count() > 0:
        raise SuspiciousOperation(
            _('It is not possible to remove a meta-model of descriptor that contains models of descriptor'))

    if dmm.in_usage():
        raise SuspiciousOperation(_("There is some data using the meta-model of descriptor"))

    dmm.delete()

    return HttpResponseRest(request, {})


@RestDescriptorMetaModelId.def_auth_request(
    Method.PUT, Format.JSON, content={
        "type": "object",
        "properties": {
            "name": {"type": "string", 'minLength': 3, 'maxLength': 32},
            "description": {"type": "string", 'minLength': 0, 'maxLength': 1024, 'blank': True},
        },
    },
    perms={'descriptor.change_descriptormetamodel': _('You are not allowed to modify a meta-model of descriptor')},
    staff=True)
def modify_descriptor_meta_model(request, id):
    dmm_id = int(id)

    dmm = get_object_or_404(DescriptorMetaModel, id=dmm_id)

    dmm.name = request.data['name']
    dmm.description = request.data['description']

    dmm.save()

    result = {
        'id': dmm.id,
        'name': dmm.name,
        'description': dmm.description,
        'target': '.'.join(dmm.target.natural_key()),
        'num_descriptor_models': dmm.descriptor_models.all().count()
    }

    return HttpResponseRest(request, result)


@RestDescriptorMetaModelId.def_auth_request(
    Method.PATCH, Format.JSON, content={
        "type": "object",
        "properties": {
            "label": {"type": "string", 'minLength': 3, 'maxLength': 32, 'required': False},
        },
    },
    perms={'descriptor.change_descriptormetamodel': _('You are not allowed to modify a meta-model of descriptor')},
    staff=True)
def patch_descriptor_meta_model(request, id):
    dmm_id = int(id)

    dmm = get_object_or_404(DescriptorMetaModel, id=dmm_id)

    label = request.data.get('label')

    if label is not None:
        lang = translation.get_language()
        dmm.set_label(lang, label)

    dmm.save()

    result = {
        'id': dmm.id,
        'name': dmm.name,
        'description': dmm.description,
        'target': '.'.join(dmm.target.natural_key()),
        'num_descriptor_models': dmm.descriptor_models.all().count()
    }

    return HttpResponseRest(request, result)


@RestDescriptorMetaModelSearch.def_auth_request(Method.GET, Format.JSON, ('filters',), staff=True)
def search_descriptor_meta_models(request):
    """
    Filters the meta-models of descriptors by name.
    @todo could needs pagination
    """
    filters = json.loads(request.GET['filters'])
    page = int_arg(request.GET.get('page', 1))

    meta_models = None

    if filters['method'] == 'ieq' and 'name' in filters['fields']:
        meta_models = DescriptorMetaModel.objects.filter(name__iexact=filters['name'])
    elif filters['method'] == 'icontains' and 'name' in filters['fields']:
        meta_models = DescriptorMetaModel.objects.filter(name__icontains=filters['name'])

    meta_models_list = []

    if meta_models:
        for meta_model in meta_models:
            meta_models_list.append({
                "id": meta_model.id,
                "name": meta_model.name,
                "label": meta_model.get_label(),
                'num_descriptor_models': meta_model.descriptor_models.all().count(),
            })

    response = {
        'items': meta_models_list,
        'page': page
    }

    return HttpResponseRest(request, response)


@RestDescriptorMetaModelIdPanel.def_auth_request(Method.GET, Format.JSON)
def list_descriptor_panels_for_meta_model(request, id):
    """
    Returns a list of panels for a metal-model of descriptors, ordered by position.
    """
    dmm_id = int(id)

    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = request.GET.get('cursor')
    limit = results_per_page

    dmm = get_object_or_404(DescriptorMetaModel, id=dmm_id)

    if cursor:
        cursor_position, cursor_id = cursor.split('/')
        qs = DescriptorPanel.objects.filter(Q(descriptor_meta_model=dmm.id), Q(position__gt=cursor_position))
    else:
        qs = DescriptorPanel.objects.filter(Q(descriptor_meta_model=dmm.id))

    descriptor_models = qs.prefetch_related(
        'descriptor_model').order_by(
        'position').prefetch_related(
        'descriptor_model')[:limit]

    panels_list = []

    for panel in descriptor_models:
        panels_list.append({
            'id': panel.id,
            'name': panel.name,
            'label': panel.get_label(),
            'position': panel.position,
            'descriptor_model': panel.descriptor_model.id,
            'descriptor_model_name': panel.descriptor_model.name,
            'descriptor_model_verbose_name': panel.descriptor_model.verbose_name
        })

    if len(panels_list) > 0:
        # prev cursor (asc order)
        panel = panels_list[0]
        prev_cursor = "%s/%s" % (panel['position'], panel['id'])

        # next cursor (asc order)
        panel = panels_list[-1]
        next_cursor = "%s/%s" % (panel['position'], panel['id'])
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


@RestDescriptorMetaModelIdPanel.def_auth_request(
    Method.POST, Format.JSON, content={
        "type": "object",
        "properties": {
            "label": {"type": "string", 'minLength': 3, 'maxLength': 64},
            "position": {"type": "number"},
            "descriptor_model": {"type": "number"},
        },
    },
    perms={
        'descriptor.change_descriptormetamodel': _('You are not allowed to modify a meta-model of descriptor'),
        'descriptor.add_descriptorpanel': _('You are not allowed to create a panel of descriptor'),
    },
    staff=True)
def create_descriptor_panel_for_meta_model(request, id):
    dmm_id = int(id)
    position = int(request.data['position'])

    lang = translation.get_language()

    dmm = get_object_or_404(DescriptorMetaModel, id=dmm_id)

    dm_id = int(request.data['descriptor_model'])
    dm = get_object_or_404(DescriptorModel, id=dm_id)

    if DescriptorPanel.objects.filter(Q(descriptor_meta_model=dmm.id), Q(descriptor_model=dm.id)).exists():
        raise SuspiciousOperation(
            _("A panel of descriptor for this model already exists into this meta-model of descriptor"))

    dp = DescriptorPanel()

    dp.name = "%i_%i" % (dmm.id, dm.id)
    dp.set_label(lang, request.data['label'])
    dp.position = position
    dp.descriptor_meta_model = dmm
    dp.descriptor_model = dm

    dp.full_clean()
    dp.save()

    # rshift of 1 others descriptor_model
    dps = DescriptorPanel.objects.filter(Q(descriptor_meta_model=dmm.id), Q(position__gte=position)).order_by(
        'position')

    for ldp in dps:
        if ldp.id != dp.id:
            new_position = ldp.position + 1
            ldp.position = new_position
            ldp.save()

    result = {
        'id': dp.id,
        'name': dp.name,
        'label': dp.get_label(),
        'position': dp.position,
        'descriptor_model': dm.id,
        'descriptor_model_name': dm.name,
        'descriptor_model_verbose_name': dm.verbose_name
    }

    return HttpResponseRest(request, result)


@RestDescriptorMetaModelIdPanelId.def_auth_request(Method.GET, Format.JSON)
def get_descriptor_panel_for_meta_model(request, id, pid):
    dmm_id = int(id)
    panel_id = int(pid)

    panel = get_object_or_404(DescriptorPanel, id=panel_id, descriptor_meta_model=dmm_id)

    result = {
        'id': panel.id,
        'name': panel.name,
        'label': panel.get_label(),
        'position': panel.position,
        'descriptor_model': panel.descriptor_model.id,
        'descriptor_model_name': panel.descriptor_model.name,
        'descriptor_model_verbose_name': panel.descriptor_model.verbose_name
    }

    return HttpResponseRest(request, result)


@RestDescriptorMetaModelIdPanelOrder.def_auth_request(Method.PUT, Format.JSON, content={
        "type": "object",
        "properties": {
            "descriptor_panel_id": {"type": "number"},
            "position": {"type": "number"},
        },
    },
    perms={
        'descriptor.change_descriptormetamodel': _('You are not allowed to modify a meta-model of descriptor'),
        'descriptor.change_descriptorpanel': _('You are not allowed to modify a panel of descriptor'),
    },
    staff=True)
def reorder_descriptor_panels_for_model(request, id):
    """
    Reorder the panels for a meta-model of descriptors according to the new position of one of the elements.
    """
    dmm_id = int(id)

    dp_id = int(request.data['descriptor_panel_id'])
    position = int(request.data['position'])

    dmm = get_object_or_404(DescriptorMetaModel, id=dmm_id)
    dp_ref = get_object_or_404(DescriptorPanel, descriptor_meta_model_id=dmm_id, id=dp_id)

    dp_list = []

    if position < dp_ref.position:
        dps = dmm.panels.filter(Q(position__gte=position)).order_by('position')

        for dp in dps:
            if dp.id != dp_id:
                dp_list.append(dp)

        dp_ref.position = position
        dp_ref.save()

        next_position = position + 1

        for dp in dp_list:
            dp.position = next_position
            dp.save()

            next_position += 1
    else:
        dps = dmm.panels.filter(Q(position__lte=position)).order_by('position')

        for dp in dps:
            if dp.id != dp_id:
                dp_list.append(dp)

        dp_ref.position = position
        dp_ref.save()

        next_position = 0

        for dp in dp_list:
            dp.position = next_position
            dp.save()

            next_position += 1

    return HttpResponseRest(request, {})


@RestDescriptorMetaModelIdPanelId.def_auth_request(
    Method.PATCH, Format.JSON, content={
        "type": "object",
        "properties": {
            "name": {"type": "string", 'minLength': 3, 'maxLength': 32, 'required': False},
            "label": {"type": "string", 'minLength': 3, 'maxLength': 32, 'required': False},
        },
    },
    perms={
        'descriptor.change_descriptormetamodel': _('You are not allowed to modify a meta-model of descriptor'),
        'descriptor.change_descriptorpanel': _('You are not allowed to modify a panel of descriptor'),
    },
    staff=True)
def modify_descriptor_panel_for_meta_model(request, id, pid):
    dmm_id = int(id)
    panel_id = int(pid)

    name = request.data.get('name')
    label = request.data.get('label')

    panel = get_object_or_404(DescriptorPanel, id=panel_id, descriptor_meta_model=dmm_id)

    if name is not None:
        panel.name = name
    if label is not None:
        lang = translation.get_language()
        panel.set_label(lang, label)

    panel.full_clean()
    panel.save()

    return HttpResponseRest(request, {})


@RestDescriptorMetaModelIdPanelId.def_auth_request(
    Method.DELETE, Format.JSON,
    perms={
        'descriptor.change_descriptormetamodel': _('You are not allowed to modify a meta-model of descriptor'),
        'descriptor.delete_descriptorpanel': _('You are not allowed to remove a panel of descriptor'),
    },
    staff=True)
def remove_descriptor_panel_of_meta_model(request, id, pid):
    dmm_id = int(id)
    panel_id = int(pid)

    dmm = get_object_or_404(DescriptorMetaModel, id= dmm_id)

    if dmm.in_usage():
        raise SuspiciousOperation(_('There is some entities attached to this panel'))

    panel = get_object_or_404(DescriptorPanel, id=panel_id, descriptor_meta_model=dmm_id)

    position = panel.position
    panel.delete()

    # reorder following panels
    dps = dmm.panels.filter(position__gt=position).order_by('position')

    for panel in dps:
        new_position = panel.position - 1
        panel.position = new_position
        panel.save()

    return HttpResponseRest(request, {})


@RestDescriptorMetaModelIdLabel.def_auth_request(Method.GET, Format.JSON)
def get_all_labels_of_descriptor_meta_model(request, id):
    """
    Returns labels for each language related to the user interface.
    """
    dmm_id = int(id)

    dmm = get_object_or_404(DescriptorMetaModel, id=dmm_id)

    label_dict = json.loads(dmm.label)

    # complete with missing languages
    for lang, lang_label in InterfaceLanguages.choices():
        if lang not in label_dict:
            label_dict[lang] = ""

    results = label_dict

    return HttpResponseRest(request, results)


@RestDescriptorMetaModelIdLabel.def_auth_request(
    Method.PUT, Format.JSON, content={
        "type": "object",
        "additionalProperties": {
            "type": "string",
            "maxLength": 64
        }
    },
    perms={
        'descriptor.change_descriptormetamodel': _('You are not allowed to modify a meta-model of descriptor'),
    },
    staff=True)
def change_all_labels_of_descriptor_meta_model(request, id):
    """
    Changes all the label, for each language related to the user interface.
    Returns only the local label.
    """
    dmm_id = int(id)

    dmm = get_object_or_404(DescriptorMetaModel, id=dmm_id)

    labels = request.data

    languages_values = [lang[0] for lang in InterfaceLanguages.choices()]

    for lang, label in labels.items():
        if lang not in languages_values:
            raise SuspiciousOperation(_("Unsupported language identifier"))

    dmm.label = json.dumps(labels)

    dmm.update_field('label')
    dmm.save()

    result = {
        'label': dmm.get_label()
    }

    return HttpResponseRest(request, result)


@RestDescriptorMetaModelIdPanelIdLabel.def_auth_request(Method.GET, Format.JSON)
def get_all_labels_of_descriptor_meta_model(request, id, pid):
    """
    Returns labels for each language related to the user interface.
    """
    dmm_id = int(id)
    dp_id = int(pid)

    dp = get_object_or_404(DescriptorPanel, id=dp_id, descriptor_meta_model=dmm_id)

    label_dict = json.loads(dp.label)

    # complete with missing languages
    for lang, lang_label in InterfaceLanguages.choices():
        if lang not in label_dict:
            label_dict[lang] = ""

    results = label_dict

    return HttpResponseRest(request, results)


@RestDescriptorMetaModelIdPanelIdLabel.def_auth_request(
    Method.PUT, Format.JSON, content={
        "type": "object",
        "additionalProperties": {
            "type": "string",
            "maxLength": 64
        }
    },
    perms={
        'descriptor.change_descriptormetamodel': _('You are not allowed to modify a meta-model of descriptor'),
        'descriptor.change_descriptorpanel': _('You are not allowed to modify a panel of descriptor'),
    },
    staff=True)
def change_all_labels_of_descriptor_panel(request, id, pid):
    """
    Changes all the label, for each language related to the user interface.
    Returns only the local label.
    """
    dmm_id = int(id)
    dp_id = int(pid)

    dp = get_object_or_404(DescriptorPanel, id=dp_id, descriptor_meta_model=dmm_id)

    labels = request.data

    languages_values = [lang[0] for lang in InterfaceLanguages.choices()]

    for lang, label in labels.items():
        if lang not in languages_values:
            raise SuspiciousOperation(_("Unsupported language identifier"))

    dp.label = json.dumps(labels)

    dp.update_field('label')
    dp.save()

    result = {
        'label': dp.get_label()
    }

    return HttpResponseRest(request, result)
