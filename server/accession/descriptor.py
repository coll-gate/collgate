# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
coll-gate accession module, descriptor API
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


class RestDescriptorGroupSearch(RestDescriptorGroup):
    regex = r'^search/$'
    suffix = 'search'


class RestDescriptorGroupId(RestDescriptorGroup):
    regex = r'^(?P<id>[0-9]+)/$'
    suffix = 'id'


class RestDescriptorGroupIdType(RestDescriptorGroupId):
    regex = r'^type/$'
    suffix = 'type'


class RestDescriptorGroupIdTypeSearch(RestDescriptorGroupIdType):
    regex = r'^search/$'
    suffix = 'search'


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
            'num_descriptors_types': descr.types_set.all().count(),
            'can_delete': descr.can_delete,
            'can_modify': descr.can_modify
        }

        descriptors_list.append(t)

    response = {
        'items': descriptors_list,
        'total_count': DescriptorGroup.objects.all().count(),
        'page': page,
    }

    return HttpResponseRest(request, response)


@RestDescriptorGroup.def_auth_request(Method.POST, Format.JSON, content={
        "type": "object",
        "properties": {
            "name": {"type": "string", 'minLength': 3, 'maxLength': 32}
        },
    },  # perms={'accession.add_descriptorgroup': _('You are not allowed to create a group of descriptor')}
)
def create_descriptor_group(request):
    group_params = request.data

    group = DescriptorGroup.objects.create(
        name=group_params['name'],
        can_delete=True,
        can_modify=True)

    response = {
        'id': group.id,
        'name': group.name,
        'num_descriptors_types': 0,
        'can_delete': group.can_delete,
        'can_modify': group.can_modify
    }

    return HttpResponseRest(request, response)


@RestDescriptorGroupId.def_auth_request(
    Method.DELETE, Format.JSON,
    perms={
        #  'accession.delete_descriptorgroup': _("You are not allowed to delete a group of descriptor"),
    }
)
def delete_descriptor_group(request, id):
    group_id = int_arg(id)
    group = get_object_or_404(DescriptorGroup, id=group_id)

    group.delete()

    return HttpResponseRest(request, {})


@RestDescriptorGroupSearch.def_auth_request(Method.GET, Format.JSON, ('filters',))
def search_descriptor_groups(request):
    filters = json.loads(request.GET['filters'])
    page = int_arg(request.GET.get('page', 1))

    groups = None

    if filters['method'] == 'ieq' and 'name' in filters['fields']:
        groups = DescriptorGroup.objects.filter(name__iexact=filters['name'])
    elif filters['method'] == 'icontains' and 'name' in filters['fields']:
        groups = DescriptorGroup.objects.filter(name__icontains=filters['name'])

    groups_list = []

    if groups:
        for group in groups:
            groups_list.append({
                "id": group.id,
                "name": group.name,
                'num_descriptors_types': group.types_set.all().count(),
                'can_delete': group.can_delete,
                'can_modify': group.can_modify
            })

    response = {
        'items': groups_list,
        'page': page
    }

    return HttpResponseRest(request, response)


@RestDescriptorGroupId.def_auth_request(Method.GET, Format.JSON)
def get_descriptor_groups(request, id):
    descriptor_id = int_arg(id)
    group = get_object_or_404(DescriptorGroup, id=descriptor_id)

    response = {
        'id': group.id,
        'name': group.name,
        'can_delete': group.can_delete,
        'can_modify': group.can_modify,
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
            'num_descriptors_values': count,
            'can_delete': descr_type.can_delete,
            'can_modify': descr_type.can_modify,
            'format': json.loads(descr_type.format)
        }

        types_list.append(t)

    response = {
        'items': types_list,
        'total_count': group.types_set.all().count(),
        'page': page,
    }

    return HttpResponseRest(request, response)


@RestDescriptorGroupIdTypeSearch.def_auth_request(Method.GET, Format.JSON, ('filters',))
def search_descriptor_types_for_group(request, id):
    filters = json.loads(request.GET['filters'])
    page = int_arg(request.GET.get('page', 1))

    group_id = int_arg(id)

    group = get_object_or_404(DescriptorGroup, id=group_id)
    descr_types = None

    if filters['method'] == 'ieq' and 'name' in filters['fields']:
        descr_types = DescriptorType.objects.filter(group=group, name__iexact=filters['name'])
    elif filters['method'] == 'icontains' and 'name' in filters['fields']:
        descr_types = DescriptorGroup.objects.filter(group=group, name__icontains=filters['name'])

    descr_types_list = []

    if descr_types:
        for descr_type in descr_types:
            if descr_type.values:
                values = json.loads(descr_type.values)
                count = len(values)
            else:
                count = descr_type.values_set.all().count()

            descr_types_list.append({
                'id': descr_type.id,
                'name': descr_type.name,
                'code': descr_type.code,
                'description': descr_type.description,
                'group': group.id,
                'num_descriptors_values': count,
                'format': json.loads(descr_type.format),
                'can_delete': descr_type.can_delete,
                'can_modify': descr_type.can_modify
            })

    response = {
        'items': descr_types_list,
        'page': page
    }

    return HttpResponseRest(request, response)


@RestDescriptorGroupIdTypeId.def_auth_request(Method.GET, Format.JSON)
def get_descriptor_type_for_group(request, id, tid):
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
        'format': json.loads(descr_type.format),
        'can_delete': descr_type.can_delete,
        'can_modify': descr_type.can_modify
    }

    return HttpResponseRest(request, response)


@RestDescriptorGroupIdType.def_auth_request(Method.POST, Format.JSON, content={
        "type": "object",
        "properties": {
            "name": {"type": "string", 'minLength': 3, 'maxLength': 32}
        },
    },  # perms={'accession.add_descriptortype': _('You are not allowed to create a type of descriptor')}
)
def create_descriptor_type(request, id):
    descr_type_params = request.data

    group_id = int_arg(id)
    group = get_object_or_404(DescriptorGroup, id=group_id)

    # generate a new internal code
    found = False
    code = DescriptorType.objects.filter(code__startswith='ID_').count() + 1
    while found:
        if not DescriptorType.objects.filter(code='ID_%03i' % code).exists():
            found = True
        else:
            code += 1

    descr_type = DescriptorType.objects.create(
        name=descr_type_params['name'],
        code='ID_%03i' % code,
        group=group,
        can_delete=True,
        can_modify=True)

    response = {
        'id': descr_type.id,
        'name': descr_type.name,
        'code': descr_type.code,
        'group': group.id,
        'num_descriptors_values': 0,
        'can_delete': descr_type.can_delete,
        'can_modify': descr_type.can_modify
    }

    return HttpResponseRest(request, response)


@RestDescriptorGroupIdTypeId.def_auth_request(
    Method.DELETE, Format.JSON,
    perms={
        #  'accession.delete_descriptortype': _("You are not allowed to delete a type of descriptor"),
    }
)
def delete_descriptor_group(request, id, tid):
    group_id = int_arg(id)
    group = get_object_or_404(DescriptorGroup, id=group_id)

    descr_type_id = int_arg(tid)
    descr_type = get_object_or_404(DescriptorType, id=descr_type_id, group=group)

    descr_type.delete()

    return HttpResponseRest(request, {})


@RestDescriptorGroupIdTypeId.def_auth_request(Method.PUT, Format.JSON, content={
        "type": "object",
        "properties": {
            "name": {"type": "string", 'minLength': 3, 'maxLength': 32},
            "code": {"type": "string", 'minLength': 3, 'maxLength': 32},
            "format": {
                "type": "object",
                "properties": {
                }
            },
        },
    },  # perms={'accession.change_descriptortype': _('You are not allowed to modify a type of descriptor')}
)
def update_descriptor_type(request, id, tid):
    descr_type_params = request.data

    group_id = int_arg(id)
    group = get_object_or_404(DescriptorGroup, id=group_id)

    type_id = int_arg(tid)

    descr_type = get_object_or_404(DescriptorType, id=type_id, group=group)

    descr_type.name = descr_type_params['name']
    descr_type.format = json.dumps(descr_type_params['format'])

    # internally stored values
    if descr_type.values:
        values = json.loads(descr_type.values)
        count = len(values)
    else:
        # values in the value table
        count = descr_type.values_set.all().count()

    descr_type.save()

    response = {
        'id': descr_type.id,
        'name': descr_type.name,
        'code': descr_type.code,
        'format': json.loads(descr_type.format),
        'group': group.id,
        'num_descriptors_values': count,
        'can_delete': descr_type.can_delete,
        'can_modify': descr_type.can_modify
    }

    return HttpResponseRest(request, response)


@RestDescriptorGroupIdTypeIdValue.def_auth_request(Method.GET, Format.JSON)
def get_descriptor_values_for_type(request, id, tid):
    results_per_page = 30
    page = int_arg(request.GET.get('page', 1))
    offset = (page-1) * results_per_page
    limit = offset + results_per_page
    sort_by = request.GET.get('sort_by', 'name')

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
                'value': v,
            }
            values_list.append(t)

        if sort_by == 'id':
            values_list = sorted(values_list, key=lambda v: v['id'])[offset:limit]
        else:
            values_list = sorted(values_list, key=lambda v: v['value'][sort_by])[offset:limit]
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
                'parents': value.parents,
                'value': value.value
            }

            values_list.append(t)

    response = {
        'format': json.loads(descr_type.format),
        'items': values_list,
        'total_count': count,
        'page': 1,
    }

    return HttpResponseRest(request, response)
