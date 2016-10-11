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

    dmm.name = request.content['name']
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
    # perms={'accession.change_descriptormetamodel': _('You are not allowed to modify a meta-model of descriptor')},
    staff=True)
def modify_descriptor_meta_model(request, id):
    dmm_id = int(id)

    dmm = get_object_or_404(DescriptorMetaModel, id=dmm_id)

    dmm.name = request.content['name']
    dmm.set_label(request.content['label'])
    dmm.description = request.content['description']

    dmm.save()

    result = {
        'id': dmm.id,
        'name': dmm.name,
        'description': dmm.description,
        'target': '.'.join(dmm.target.natural_key()),
        'num_descriptors_models': dmm.descriptors_models.all().count()
    }

    return HttpResponseRest(request, result)
