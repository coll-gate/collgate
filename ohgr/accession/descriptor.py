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


@RestDescriptorGroup.def_auth_request(Method.GET, Format.JSON)
def get_descriptor_groups(request):
    results_per_page = 30
    page = int_arg(request.GET.get('page', 1))
    offset = (page-1) * results_per_page
    limit = offset + results_per_page

    descriptors = DescriptorGroup.objects.all()[offset:limit]

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


@RestDescriptorGroupIdType.def_auth_request(Method.GET, Format.JSON)
def get_descriptor_types_for_group(request, id):
    results_per_page = 30
    page = int_arg(request.GET.get('page', 1))
    offset = (page-1) * results_per_page
    limit = offset + results_per_page

    group_id = int(id)
    group = get_object_or_404(DescriptorGroup, id=group_id)
    types = group.type_set.all()[offset:limit]

    types_list = []
    for descr_type in types:
        t = {
            'id': descr_type.pk,
            'name': descr_type.name,
            'code': descr_type.code,
            'description': descr_type.description
        }

        types_list.append(t)

    response = {
        'items': types_list,
        'total_count': group.types_set.all().count(),
        'page': 1,
    }

    return HttpResponseRest(request, response)


@RestDescriptorGroupIdTypeId.def_auth_request(Method.GET, Format.JSON)
def get_descriptor_type_for_group(request, id, tid):
    results_per_page = 30
    page = int_arg(request.GET.get('page', 1))
    offset = (page-1) * results_per_page
    limit = offset + results_per_page

    group_id = int(id)
    type_id = int(tid)

    group = get_object_or_404(DescriptorGroup, id=group_id)
    descr_type = get_object_or_404(DescriptorType, id=type_id, group=group)

    # internally stored values
    if descr_type.value:
        values = json.loads(descr_type.value)
        count = len(values)

        values_list = []
        for value in values:
            t = {
                'id': value['id'],
                'value': value['value'],
            }

            values_list.append(t)
    else:
        # values in the value table
        qs = descr_type.values_set.all()
        values = qs[offset:limit]
        count = qs.count()

        values_list = []
        for value in values:
            t = {
                'id': value.id,
                'name': descr_type.name,
                'code': descr_type.code,
                'description': descr_type.description
            }

            values_list.append(t)

    response = {
        'items': values_list,
        'total_count': count,
        'page': 1,
    }

    return HttpResponseRest(request, response)
