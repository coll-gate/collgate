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
from django.utils.translation import ugettext_lazy as _

from igdectk.common.helpers import int_arg
from igdectk.rest import Format, Method
from igdectk.rest.response import HttpResponseRest

from .base import RestAccession
from .models import DescriptorModel, DescriptorModelType, DescriptorPanel


class RestDescriptorModel(RestAccession):
    regex = r'^descriptor/model/$'
    name = 'descriptor-model'


class RestDescriptorModelSearch(RestDescriptorModel):
    regex = r'^search/$'
    suffix = 'search'


class RestDescriptorModelId(RestDescriptorModel):
    regex = r'^(?P<id>[0-9]+)/$'
    suffix = 'id'


class RestDescriptorModelIdType(RestDescriptorModelId):
    regex = r'^type/$'
    suffix = 'type'


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
        qs = DescriptorModel.objects.filter(Q(name__gt=cursor_name))
    else:
        qs = DescriptorModel.objects.all()

    dms = qs.order_by('name')[:limit]

    dm_list = []

    for dm in dms:
        dm_list.append({
            'id': dm.id,
            'name': dm.name,
            'verbose_name': dm.verbose_name,
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
            "verbose_name": {"type": "string", 'maxLength': 255, "required": False, "blank": True},
            "description": {"type": "string", 'maxLength': 1024, "required": False, "blank": True},
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

    verbose_name = request.data.get('verbose_name')
    if verbose_name:
        dm.verbose_name = request.data.get('verbose_name', '')
    else:
        dm.verbose_name = request.data['name'].capitalize()

    dm.description = request.data.get('description', None)
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
    Method.PUT, Format.JSON, content={
        "type": "object",
        "properties": {
            "name": {"type": "string", 'minLength': 3, 'maxLength': 32},
            "verbose_name": {"type": "string", 'maxLength': 255, "required": False, "blank": True},
            "description": {"type": "string", 'maxLength': 1024, "required": False, "blank": True},
        },
    },
    # perms={'accession.add_descriptormodel': _('You are not allowed to create a model of descriptor')},
    staff=True)
def update_descriptor_model(request, id):
    dm_id = int(id)

    model = get_object_or_404(DescriptorModel, id=dm_id)

    name = request.data['name']
    verbose_name = request.data.get('verbose_name', '')
    description = request.data.get('description', '')

    model.name = name
    model.verbose_name = verbose_name
    model.description = description

    model.full_clean()
    model.save()

    return HttpResponseRest(request, {})


@RestDescriptorModelId.def_auth_request(
    Method.DELETE, Format.JSON,
    # perms={'accession.remove_descriptormodel': _('You are not allowed to remove a model of descriptor')},
    staff=True)
def remove_descriptor_model(request, id):
    dm_id = int(id)

    model = get_object_or_404(DescriptorModel, id=dm_id)

    if model.descriptors_types.all().exists():
        raise SuspiciousOperation(_("Only empty models of descriptors can be removed"))

    model.delete()
    return HttpResponseRest(request, {})


@RestDescriptorModelSearch.def_auth_request(
    Method.GET, Format.JSON, ('filters',),
    staff=True)
def search_descriptor_models(request):
    """
    Filters the models of descriptors by name.
    @todo could needs pagination
    """
    filters = json.loads(request.GET['filters'])
    page = int_arg(request.GET.get('page', 1))

    models = None

    if filters['method'] == 'ieq' and 'name' in filters['fields']:
        models = DescriptorModel.objects.filter(name__iexact=filters['name'])
    elif filters['method'] == 'icontains' and 'name' in filters['fields']:
        models = DescriptorModel.objects.filter(name__icontains=filters['name'])

    models_list = []

    if models:
        for model in models:
            models_list.append({
                "id": model.id,
                "name": model.name,
                'num_descriptors_types': model.descriptors_types.all().count(),
                # 'can_delete': model.can_delete,
                # 'can_modify': model.can_modify
            })

    response = {
        'items': models_list,
        'page': page
    }

    return HttpResponseRest(request, response)
