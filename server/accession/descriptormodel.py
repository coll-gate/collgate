# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
coll-gate accession module, descriptor API
"""
import json

from django.core.exceptions import SuspiciousOperation
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import translation
from django.utils.translation import ugettext_lazy as _

from igdectk.common.helpers import int_arg
from igdectk.rest import Format, Method
from igdectk.rest.response import HttpResponseRest

from .base import RestAccession
from .models import DescriptorModel, DescriptorModelType, DescriptorPanel


class RestDescriptorModel(RestAccession):
    regex = r'^descriptor/model$'
    name = 'descriptor-model'


class RestDescriptorModelId(RestDescriptorModel):
    regex = r'^(?P<id>[0-9]+)/$'
    suffix = 'id'


class RestDescriptorModelIdType(RestDescriptorModelId):
    regex = r'^type$'
    suffix = 'type'


class RestDescriptorModelIdPanel(RestDescriptorModelId):
    regex = r'^panel'
    suffix = 'panel'


class RestDescriptorModelIdPanelId(RestDescriptorModelIdPanel):
    regex = r'^(?P<pid>[0-9]+)/$'
    suffix = 'id'


@RestDescriptorModel.def_auth_request(Method.GET, Format.JSON)
def get_descriptors_models(request):
    """
    Returns a list of models of descriptors ordered by name.
    """
    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = request.GET.get('cursor')
    limit = results_per_page

    if cursor:
        cursor_name, cursor_id = cursor.split('/')
        qs = DescriptorModel.objects.filter(Q(name__lte=cursor_name) & Q(name__lt=cursor_name) | (Q(name=cursor_name) & Q(id__lt=cursor_id)))
    else:
        qs = DescriptorModel.objects.all()

    dms = qs.order_by('name').order_by('id')[:limit]

    dm_list = []

    for dm in dms:
        dm_list.append({
            'id': dm.id,
            'name': dm.name,
            'verbose_name': dm.name,
            'description': dm.description,
            'num_descriptors_types': dm.descriptors_types.all().count()
        })

    if len(dm_list) > 0:
        # prev cursor (asc order)
        dm = dm_list[0]
        prev_cursor = "%s/%s" % (dm['name'], dm['id'])

        # next cursor (asc order)
        dm = dm_list[-1]
        next_cursor = "%s/%s" % (dm['name'], dm['id'])
    else:
        prev_cursor = None
        next_cursor = None

    results = {
        'perms': [],
        'items': dm_list,
        'prev': prev_cursor,
        'cursor': cursor,
        'next': next_cursor,
    }

    return HttpResponseRest(request, results)


@RestDescriptorModelId.def_auth_request(Method.GET, Format.JSON)
def get_descriptor_model(request, id):
    dm_id = int(id)
    dm = get_object_or_404(DescriptorModel, id=dm_id)

    result = {
        'id': dm.id,
        'name': dm.name,
        'verbose_name': dm.verbose_name,
        'description': dm.description,
        'num_descriptors_types': dm.descriptors_types.all().count()
    }

    return HttpResponseRest(request, result)


@RestDescriptorModel.def_auth_request(
    Method.POST, Format.JSON, content={
        "type": "object",
        "properties": {
            "name": {"type": "string", 'minLength': 3, 'maxLength': 32},
            "verbose_name": {"type": "string", 'minLength': 3, 'maxLength': 255},
            "description": {"type": "string", 'maxLength': 1024},
        },
    },
    # perms={'accession.add_descriptormodel': _('You are not allowed to create a model of descriptor')},
    staff=True)
def create_descriptor_model(request):
    # check name uniqueness
    if DescriptorModel.objects.filter(name=request.data['name']).exists():
        raise SuspiciousOperation(_('A model of descriptor with a similar name already exists'))

    # create descriptor model
    dm = DescriptorModel(name=request.data['name'])
    dm.verbose_name = request.data['verbose_name']
    dm.description = request.data['description']
    dm.save()

    result = {
        'id': dm.id,
        'name': dm.name,
        'verbose_name': dm.verbose_name,
        'description': dm.description,
        'num_descriptors_types': 0
    }

    return HttpResponseRest(request, result)


@RestDescriptorModelId.def_auth_request(
    Method.POST, Format.JSON, content={
        "type": "object",
        "properties": {
            "name": {"type": "string", 'minLength': 3, 'maxLength': 32}
        },
    },
    # perms={'accession.add_descriptormodel': _('You are not allowed to create a model of descriptor')},
    staff=True)
def modify_descriptor_model(request):
    pass


@RestDescriptorModelId.def_auth_request(
    Method.DELETE, Format.JSON,
    # perms={'accession.remove_descriptormodel': _('You are not allowed to remove a model of descriptor')},
    staff=True)
def remove_descriptor_model(request, id):
    dm_id = int(id)
    pass


@RestDescriptorModelIdPanel.def_auth_request(Method.GET, Format.JSON)
def list_descriptor_model_panels(request, id):
    dm_id = int(id)
    pass


@RestDescriptorModelIdPanel.def_auth_request(
    Method.POST, Format.JSON, content={
        "type": "object",
        "properties": {
            "name": {"type": "string", 'minLength': 3, 'maxLength': 32}
        },
    },
    # perms={'accession.add_descriptorpanel': _('You are not allowed to create a panel of descriptor')},
    staff=True)
def create_descriptor_model_panel(request, id):
    dm_id = int(id)
    pass


@RestDescriptorModelIdPanelId.def_auth_request(Method.GET, Format.JSON)
def get_descriptor_model_panel(request, id, pid):
    dm_id = int(id)
    panel_id = int(pid)
    pass


@RestDescriptorModelIdPanelId.def_auth_request(
    Method.DELETE, Format.JSON,
    # perms={'accession.remove_descriptorpanel': _('You are not allowed to remove a panel of descriptor')},
    staff=True)
def remove_descriptor_model_panel(request, id, pid):
    dm_id = int(id)
    panel_id = int(pid)
    pass


@RestDescriptorModelIdPanelId.def_auth_request(
    Method.PUT, Format.JSON,
    # perms={'accession.change_descriptorpanel': _('You are not allowed to modify a panel of descriptor')},
    staff=True)
def modify_descriptor_model_panel(request, id, pid):
    dm_id = int(id)
    panel_id = int(pid)
    pass
