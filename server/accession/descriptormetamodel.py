# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
coll-gate accession module, descriptor meta-model API
"""
import json

from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import SuspiciousOperation
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils.translation import ugettext_lazy as _

from igdectk.common.helpers import int_arg
from igdectk.rest import Format, Method
from igdectk.rest.response import HttpResponseRest

from .base import RestAccession
from .models import DescriptorModel, DescriptorModelType, DescriptorPanel, DescriptorMetaModel


class RestDescriptorMetaModel(RestAccession):
    regex = r'^meta-model/'
    suffix = 'meta-model'


class RestDescriptorMetaModelId(RestDescriptorMetaModel):
    regex = r'^(?P<id>[0-9]+)/$'
    suffix = 'id'


class RestDescriptorMetaModelIdPanel(RestDescriptorMetaModelId):
    regex = r'^panel/'
    suffix = 'panel'


class RestDescriptorMetaModelIdPanelId(RestDescriptorMetaModelIdPanel):
    regex = r'^(?P<pid>[0-9]+)/$'
    suffix = 'id'


@RestDescriptorMetaModel.def_auth_request(Method.GET, Format.JSON)
def list_descriptor_metal_models(request):
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
            'num_descriptors_models': dmm.descriptors_models.all().count()
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
            "target": {"type": "string", 'minLength': 1, 'maxLength': 128}
        },
    },
    # perms={'accession.add_descriptormetamodel': _('You are not allowed to create a meta-model of descriptor')},
    staff=True)
def create_descriptor_meta_model(request):
    app_label, model = request.content['target'].split('.')

    content_type = get_object_or_404(ContentType, app_label=app_label, model=model)

    dmm = DescriptorMetaModel()

    dmm.name = request.data['name']
    dmm.description = ''
    dmm.target = content_type

    dmm.save()

    result = {
        'id': dmm.id,
        'name': dmm.name,
        'description': '',
        'target': '.'.join(content_type.natural_key()),
        'num_descriptors_models': 0
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
        'num_descriptors_models': dmm.descriptors_models.all().count()
    }

    return HttpResponseRest(request, result)


@RestDescriptorMetaModelId.def_auth_request(
    Method.DELETE, Format.JSON,
    # perms={'accession.remove_descriptormetamodel': _('You are not allowed to remove a meta-model of descriptor')},
    staff=True)
def remove_descriptor_meta_model(request, id):
    dmm_id = int(id)

    dmm = get_object_or_404(DescriptorMetaModel, id=dmm_id)

    if dmm.descriptors_models.all().count() > 0:
        raise SuspiciousOperation(
            _('It is not possible to remove a meta-model of descriptor that contains models of descriptors'))

    if dmm.accessions.all().count() > 0:
        raise SuspiciousOperation(
            _('It is not possible to remove a meta-model of descriptor that is used by accessions'))

    if dmm.samples.all().count() > 0:
        raise SuspiciousOperation(
            _('It is not possible to remove a meta-model of descriptor that is used by samples'))

    if dmm.batches.all().count() > 0:
        raise SuspiciousOperation(
            _('It is not possible to remove a meta-model of descriptor that is used by batches'))

    dmm.delete()
    # dmm.remove_entity()

    return HttpResponseRest(request, {})


@RestDescriptorMetaModelId.def_auth_request(
    Method.PUT, Format.JSON, content={
        "type": "object",
        "properties": {
            "name": {"type": "string", 'minLength': 3, 'maxLength': 32},
            "label": {"type": "string", 'minLength': 3, 'maxLength': 32},
            "description": {"type": "string", 'minLength': 0, 'maxLength': 1024},
        },
    },
    # perms={'accession.change_descriptormeta   model': _('You are not allowed to modify a meta-model of descriptor')},
    staff=True)
def modify_descriptor_meta_model(request, id):
    dmm_id = int(id)

    dmm = get_object_or_404(DescriptorMetaModel, id=dmm_id)

    dmm.name = request.data['name']
    dmm.set_label(request.data['label'])
    dmm.description = request.data['description']

    dmm.save()

    result = {
        'id': dmm.id,
        'name': dmm.name,
        'description': dmm.description,
        'target': '.'.join(dmm.target.natural_key()),
        'num_descriptors_models': dmm.descriptors_models.all().count()
    }

    return HttpResponseRest(request, result)


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
        qs = dmm.panels.filter(Q(position__gt=cursor_position))
    else:
        qs = dmm.panels.all()

    panels = qs.order_by('position')[:limit]

    panels_list = []

    for panel in panels:
        panels_list.append({
            'id': panel.id,
            'name': panel.name,
            'label': panel.get_label(),
            'position': panel.position,
            'descriptor_model': panel.descriptor_model.id
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
            "name": {"type": "string", 'minLength': 3, 'maxLength': 32},
            "position": {"type": "number"},
            "descriptor_model": {"type": "number"},
        },
    },
    # perms={
    #     'accession.change_descriptormetamodel': _('You are not allowed to modify a meta-model of descriptor'),
    #     'accession.add_descriptorpanel': _('You are not allowed to create a panel of descriptor'),
    # },
    staff=True)
def create_descriptor_panel_for_meta_model(request, id):
    dmm_id = int(id)
    position = int(request.data['position'])

    dmm = get_object_or_404(DescriptorMetaModel, id=dmm_id)

    # check if the position is available else raise an exception
    if DescriptorPanel.objects.filter(descriptor_meta_model=dmm, position=position).exists():
        raise SuspiciousOperation(
            _("The position %i for the panel is already used into this meta-model of descriptor" % position))

    dm_id = int(request.data['descriptor_model'])
    dm = get_object_or_404(DescriptorModel, id=dm_id)

    panel = DescriptorPanel()

    panel.name = request.data['name']
    panel.position = position
    panel.descriptor_meta_model = dmm
    panel.descriptor_model = dm

    panel.save()

    result = {
        'id': panel.id,
        'name': panel.name,
        'label': '',
        'position': panel.position,
        'descriptor_model': dm.id
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
        'descriptor_model': panel.descriptor_model.id
    }

    return HttpResponseRest(request, result)


@RestDescriptorMetaModelIdPanelId.def_auth_request(
    Method.PUT, Format.JSON, content={
        "type": "object",
        "properties": {
            "name": {"type": "string", 'minLength': 3, 'maxLength': 32},
            "label": {"type": "string", 'minLength': 3, 'maxLength': 32},
            "position": {"type": "number"},
        },
    },
    # perms={
    #     'accession.change_descriptormetamodel': _('You are not allowed to modify a meta-model of descriptor'),
    #     'accession.change_descriptorpanel': _('You are not allowed to remove a panel of descriptor'),
    # },
    staff=True)
def modify_descriptor_panel_for_meta_model(request, id, pid):
    dmm_id = int(id)
    panel_id = int(pid)
    position = int(request.data['position'])

    panel = get_object_or_404(DescriptorPanel, id=panel_id, descriptor_meta_model=dmm_id)

    # check if the position is available else raise an exception
    if DescriptorPanel.objects.filter(descriptor_meta_model=dmm_id, position=position).exists():
        raise SuspiciousOperation(
            _("The position %i for the panel is already used into this meta-model of descriptor" % position))

    panel.name = request.data['name']
    panel.set_label(request.data['label'])
    panel.position = position

    panel.save()

    result = {
        'id': panel.id,
        'name': panel.name,
        'label': panel.get_label(),
        'position': panel.position,
        'descriptor_model': panel.descriptor_model.id
    }

    return HttpResponseRest(request, result)


@RestDescriptorMetaModelIdPanelId.def_auth_request(
    Method.DELETE, Format.JSON,
    # perms={
    #     'accession.change_descriptormetamodel': _('You are not allowed to modify a meta-model of descriptor'),
    #     'accession.remove_descriptorpanel': _('You are not allowed to remove a panel of descriptor'),
    # },
    staff=True)
def remove_descriptor_panel_of_meta_model(request, id, pid):
    dmm_id = int(id)
    panel_id = int(pid)

    panel = get_object_or_404(DescriptorPanel, id=panel_id, descriptor_meta_model=dmm_id)
    panel.delete()

    return HttpResponseRest(request, {})
