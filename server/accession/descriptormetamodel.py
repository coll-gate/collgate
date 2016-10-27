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
from django.utils import translation
from django.utils.translation import ugettext_lazy as _

from igdectk.common.helpers import int_arg
from igdectk.rest import Format, Method
from igdectk.rest.response import HttpResponseRest

from .base import RestAccession
from .models import DescriptorModel, DescriptorModelType, DescriptorPanel, DescriptorMetaModel


class RestDescriptorMetaModel(RestAccession):
    regex = r'^descriptor/meta-model/$'
    suffix = 'descriptor-meta-model'


class RestDescriptorMetaModelSearch(RestDescriptorMetaModel):
    regex = r'^search/$'
    suffix = 'search'


class RestDescriptorMetaModelId(RestDescriptorMetaModel):
    regex = r'^(?P<id>[0-9]+)/$'
    suffix = 'id'


class RestDescriptorMetaModelIdPanel(RestDescriptorMetaModelId):
    regex = r'^panel/$'
    suffix = 'panel'


class RestDescriptorMetaModelIdPanelOrder(RestDescriptorMetaModelIdPanel):
    regex = r'^order/$'
    suffix = 'order'


class RestDescriptorMetaModelIdPanelId(RestDescriptorMetaModelIdPanel):
    regex = r'^(?P<pid>[0-9]+)/$'
    suffix = 'id'


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
            "target": {"type": "string", 'minLength': 1, 'maxLength': 128},
            "description": {"type": "string", 'minLength': 0, 'maxLength': 1024}
        },
    },
    perms={'accession.add_descriptormetamodel': _('You are not allowed to create a meta-model of descriptor')},
    staff=True)
def create_descriptor_meta_model(request):
    app_label, model = request.data['target'].split('.')

    content_type = get_object_or_404(ContentType, app_label=app_label, model=model)

    dmm = DescriptorMetaModel()

    dmm.name = request.data['name']
    dmm.description = request.data['description']
    dmm.target = content_type

    dmm.full_clean()
    dmm.save()

    result = {
        'id': dmm.id,
        'name': dmm.name,
        'description': '',
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
    perms={'accession.remove_descriptormetamodel': _('You are not allowed to remove a meta-model of descriptor')},
    staff=True)
def remove_descriptor_meta_model(request, id):
    dmm_id = int(id)

    dmm = get_object_or_404(DescriptorMetaModel, id=dmm_id)

    if dmm.descriptor_models.all().count() > 0:
        raise SuspiciousOperation(
            _('It is not possible to remove a meta-model of descriptor that contains models of descriptor'))

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
            "description": {"type": "string", 'minLength': 0, 'maxLength': 1024},
        },
    },
    perms={'accession.change_descriptormetamodel': _('You are not allowed to modify a meta-model of descriptor')},
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
    perms={'accession.change_descriptormetamodel': _('You are not allowed to modify a meta-model of descriptor')},
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
                "label": meta_model.label,
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
        qs = dmm.descriptor_models.filter(Q(position__gt=cursor_position))
    else:
        qs = dmm.descriptor_models.all()

    descriptor_models = qs.order_by('position')[:limit]

    panels_list = []

    for panel in descriptor_models:
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
    perms={
        'accession.change_descriptormetamodel': _('You are not allowed to modify a meta-model of descriptor'),
        'accession.add_descriptorpanel': _('You are not allowed to create a panel of descriptor'),
    },
    staff=True)
def create_descriptor_panel_for_meta_model(request, id):
    dmm_id = int(id)
    position = int(request.data['position'])

    dmm = get_object_or_404(DescriptorMetaModel, id=dmm_id)

    dm_id = int(request.data['descriptor_model'])
    dm = get_object_or_404(DescriptorModel, id=dm_id)

    dp = DescriptorPanel()

    dp.name = request.data['name']
    dp.position = position
    dp.descriptor_meta_model = dmm
    dp.descriptor_model = dm

    dp.full_clean()
    dp.save()

    # rshift of 1 others descriptor_model
    for ldp in dmm.descriptor_models.filter(position__gte=position).order_by('position'):
        if ldp.id != dp.id:
            new_position = ldp.position + 1
            ldp.position = new_position
            ldp.save()

    result = {
        'id': dp.id,
        'name': dp.name,
        'label': '',
        'position': dp.position,
        'descriptor_model': dm.id,
        'descriptor_model_name': dm.name
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
        'descriptor_model_name': panel.descriptor_model.name
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
        'accession.change_descriptormetamodel': _('You are not allowed to modify a meta-model of descriptor'),
        'accession.change_descriptorpanel': _('You are not allowed to modify a panel of descriptor'),
    },
    staff=True)
def reorder_descriptor_types_for_model(request, id):
    """
    Reorder the panels for a meta-model of descriptors according to the new position of one of the elements.
    """
    dmm_id = int(id)

    dp_id = int(request.data['descriptor_panel_id'])
    position = int(request.data['position'])

    dmm = get_object_or_404(DescriptorMetaModel, id=dmm_id)
    dp_ref = get_object_or_404(DescriptorPanel, id=dmm_id, descriptor_panel__id=dp_id)

    dp_list = []

    if position < dp_ref.position:
        for dp in dmm.descriptor_models.filter(position__gte=position).order_by('position'):
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
        for dp in dmm.descriptor_models.filter(position__lte=position).order_by('position'):
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
        'accession.change_descriptormetamodel': _('You are not allowed to modify a meta-model of descriptor'),
        'accession.change_descriptorpanel': _('You are not allowed to modify a panel of descriptor'),
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
        'accession.change_descriptormetamodel': _('You are not allowed to modify a meta-model of descriptor'),
        'accession.delete_descriptorpanel': _('You are not allowed to remove a panel of descriptor'),
    },
    staff=True)
def remove_descriptor_panel_of_meta_model(request, id, pid):
    dmm_id = int(id)
    panel_id = int(pid)

    dmm = get_object_or_404(DescriptorMetaModel, id= dmm_id)

    panel = get_object_or_404(DescriptorPanel, id=panel_id, descriptor_meta_model=dmm_id)

    position = panel.position
    panel.delete()

    # reorder following panels
    for panel in dmm.descriptor_models.filter(position__gt=position).order_by('position'):
        new_position = panel.position - 1
        panel.position = new_position
        panel.save()

    return HttpResponseRest(request, {})

