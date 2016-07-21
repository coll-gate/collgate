# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
ohgr accession module, descriptor API
"""
import json

from django.shortcuts import get_object_or_404

from igdectk.common.helpers import int_arg
from igdectk.rest import Format, Method
from igdectk.rest.response import HttpResponseRest

from main.models import Languages

from .base import RestAccession
from .models import DescriptorType, DescriptorGroup, DescriptorValue


class RestDescriptor(RestAccession):
    regex = r'^descriptor/$'
    name = 'descriptor'


class RestDescriptorGroup(RestDescriptor):
    regex = r'^group/$'
    suffix = 'group'


class RestDescriptorGroupId(RestDescriptorGroup):
    regex = r'^(?P<id>[0-9]+)/$'
    suffix = 'id'


class RestDescriptorGroupIdType(RestDescriptorGroupId):
    regex = r'^type/$'
    suffix = 'type'


class RestDescriptorGroupIdTypeId(RestDescriptorGroupIdType):
    regex = r'^(?P<tid>[0-9]+)/$'
    suffix = 'id'


class RestDescriptorGroupIdTypeIdValue(RestDescriptorGroupIdTypeId):
    regex = r'^value/$'
    suffix = 'value'


@RestDescriptorGroup.def_auth_request(Method.GET, Format.JSON)
def get_descriptor_groups(request):
    results_per_page = 30
    page = int_arg(request.GET.get('page', 1))
    offset = (page-1) * results_per_page
    limit = offset + results_per_page

    descriptors = DescriptorGroup.objects.all().order_by('name')[offset:limit]

    descriptors_list = []
    for descr in descriptors:
        t = {
            'id': descr.pk,
            'name': descr.name,
            'num_descriptors_types': descr.types_set.all().count()
        }

        descriptors_list.append(t)

    response = {
        'items': descriptors_list,
        'total_count': DescriptorGroup.objects.all().count(),
        'page': 1,
    }

    return HttpResponseRest(request, response)


@RestDescriptorGroupId.def_auth_request(Method.GET, Format.JSON)
def get_descriptor_groups(request, id):
    descriptor_id = int_arg(id)
    group = get_object_or_404(DescriptorGroup, id=descriptor_id)

    response = {
        'id': group.id,
        'name': group.name,
        'num_descriptors_types': group.types_set.all().count()
    }

    return HttpResponseRest(request, response)


@RestDescriptorGroupIdType.def_auth_request(Method.GET, Format.JSON)
def get_descriptor_types_for_group(request, id):
    results_per_page = 30
    page = int_arg(request.GET.get('page', 1))
    offset = (page-1) * results_per_page
    limit = offset + results_per_page

    group_id = int(id)
    group = get_object_or_404(DescriptorGroup, id=group_id)
    types = group.types_set.all().order_by('name')[offset:limit]

    types_list = []
    for descr_type in types:
        if descr_type.values:
            values = json.loads(descr_type.values)
            count = len(values)
        else:
            count = descr_type.values_set.all().count()

        t = {
            'id': descr_type.pk,
            'group': group_id,
            'name': descr_type.name,
            'code': descr_type.code,
            'description': descr_type.description,
            'num_descriptors_values': count
        }

        types_list.append(t)

    response = {
        'items': types_list,
        'total_count': group.types_set.all().count(),
        'page': 1,
    }

    return HttpResponseRest(request, response)


@RestDescriptorGroupIdTypeId.def_auth_request(Method.GET, Format.JSON)
def get_descriptor_types_for_group(request, id, tid):
    group_id = int_arg(id)
    type_id= int_arg(tid)
    group = get_object_or_404(DescriptorGroup, id=group_id)
    descr_type = get_object_or_404(DescriptorType, id=type_id)

    if descr_type.values:
        values = json.loads(descr_type.values)
        count = len(values)
    else:
        count = descr_type.values_set.all().count()

    response = {
        'id': descr_type.id,
        'name': descr_type.name,
        'code': descr_type.code,
        'description': descr_type.description,
        'group': group.id,
        'num_descriptors_values': count,
    }

    return HttpResponseRest(request, response)


@RestDescriptorGroupIdTypeIdValue.def_auth_request(Method.GET, Format.JSON)
def get_descriptor_type_for_group(request, id, tid):
    results_per_page = 30
    page = int_arg(request.GET.get('page', 1))
    offset = (page-1) * results_per_page
    limit = offset + results_per_page
    sort_by = request.GET.get('sort_by', 'value')

    group_id = int(id)
    type_id = int(tid)

    group = get_object_or_404(DescriptorGroup, id=group_id)
    descr_type = get_object_or_404(DescriptorType, id=type_id, group=group)

    # internally stored values
    if descr_type.values:
        values = json.loads(descr_type.values)
        count = len(values)

        values_list = []
        for k, v in values.items():
            t = {
                'id': k,
                'value': v['name'],
            }

            values_list.append(t)

        values_list = sorted(values_list, key=lambda v: v[sort_by])[offset:limit]
    else:
        # values in the value table
        qs = descr_type.values_set.all()
        values = qs[offset:limit]
        count = qs.count()

        # TODO see for ordering, because if we have json field...
        # maybe could we use hstore ?
        # or a value field plus an informational field about value type

        values_list = []
        for value in values:
            t = {
                'id': value.id,
                'name': descr_type.name,
                'value': descr_type.value,
                # 'description': descr_type.description
            }

            values_list.append(t)

    response = {
        'items': values_list,
        'total_count': count,
        'page': 1,
    }

    return HttpResponseRest(request, response)
