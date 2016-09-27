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
from .models import DescriptorType, DescriptorGroup


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
    """
    Descriptor group name is unique and indexed.
    """
    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = request.GET.get('cursor')
    limit = results_per_page

    if cursor:
        cursor_name, cursor_id = cursor.split('/')
        qs = DescriptorGroup.objects.filter(Q(name__gt=cursor_name))
    else:
        qs = DescriptorGroup.objects.all()

    dgs = qs.order_by('name')[:limit]

    group_list = []
    for group in dgs:
        group_list.append({
            'id': group.pk,
            'name': group.name,
            'num_descriptors_types': group.types_set.all().count(),
            'can_delete': group.can_delete,
            'can_modify': group.can_modify
        })

    if len(group_list) > 0:
        # prev cursor (asc order)
        dm = group_list[0]
        prev_cursor = "%s/%s" % (dm['name'], dm['id'])

        # next cursor (asc order)
        dm = group_list[-1]
        next_cursor = "%s/%s" % (dm['name'], dm['id'])
    else:
        prev_cursor = None
        next_cursor = None

    results = {
        'perms': [],
        'items': group_list,
        'prev': prev_cursor,
        'cursor': cursor,
        'next': next_cursor,
    }

    return HttpResponseRest(request, results)


@RestDescriptorGroup.def_auth_request(
    Method.POST, Format.JSON, content={
        "type": "object",
        "properties": {
            "name": {"type": "string", 'minLength': 3, 'maxLength': 32}
        },
    },
    # perms={'accession.add_descriptorgroup': _('You are not allowed to create a group of descriptor')},
    staff=True
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
    },
    staff=True
)
def delete_descriptor_group(request, id):
    group_id = int_arg(id)
    group = get_object_or_404(DescriptorGroup, id=group_id)

    if group.types_set.count() > 0:
        raise SuspiciousOperation(_("Only an empty group of descriptors can be deleted"))

    group.delete()

    return HttpResponseRest(request, {})


@RestDescriptorGroupSearch.def_auth_request(
    Method.GET, Format.JSON, ('filters',),
    staff=True)
def search_descriptor_groups(request):
    """
    Filters the groups of descriptors by name.
    @todo could needs pagination
    """
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
    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = request.GET.get('cursor')
    limit = results_per_page

    group_id = int(id)
    group = get_object_or_404(DescriptorGroup, id=group_id)

    if cursor:
        cursor_name, cursor_id = cursor.split('/')
        qs = group.types_set.filter(Q(name__gt=cursor_name))
    else:
        qs = group.types_set.all()

    dts = qs.order_by('name')[:limit]

    types_list = []
    for descr_type in dts:
        count = descr_type.count_num_values()

        types_list.append({
            'id': descr_type.pk,
            'group': group_id,
            'name': descr_type.name,
            'code': descr_type.code,
            'description': descr_type.description,
            'num_descriptors_values': count,
            'can_delete': descr_type.can_delete,
            'can_modify': descr_type.can_modify,
            'format': json.loads(descr_type.format)
        })

    if len(types_list) > 0:
        # prev cursor (asc order)
        dm = types_list[0]
        prev_cursor = "%s/%s" % (dm['name'], dm['id'])

        # next cursor (asc order)
        dm = types_list[-1]
        next_cursor = "%s/%s" % (dm['name'], dm['id'])
    else:
        prev_cursor = None
        next_cursor = None

    results = {
        'perms': [],
        'items': types_list,
        'prev': prev_cursor,
        'cursor': cursor,
        'next': next_cursor,
    }

    return HttpResponseRest(request, results)


@RestDescriptorGroupIdTypeSearch.def_auth_request(
    Method.GET, Format.JSON, ('filters',),
    staff=True)
def search_descriptor_types_for_group(request, id):
    """
    Filters the type of descriptors by name for a specific group.
    @todo needs pagination
    """
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
            count = descr_type.count_num_values()

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

    count = descr_type.count_num_values()

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


@RestDescriptorGroupIdType.def_auth_request(
    Method.POST, Format.JSON, content={
        "type": "object",
        "properties": {
            "name": {"type": "string", 'minLength': 3, 'maxLength': 32}
        },
    },
    # perms={'accession.add_descriptortype': _('You are not allowed to create a type of descriptor')},
    staff=True
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
    },
    staff=True
)
def delete_descriptor_group(request, id, tid):
    group_id = int_arg(id)
    group = get_object_or_404(DescriptorGroup, id=group_id)

    descr_type_id = int_arg(tid)
    descr_type = get_object_or_404(DescriptorType, id=descr_type_id, group=group)

    if descr_type.has_values():
        raise SuspiciousOperation(_("Only an empty of values type of descriptors can be deleted"))

    descr_type.delete()

    return HttpResponseRest(request, {})


@RestDescriptorGroupIdTypeId.def_auth_request(
    Method.PUT, Format.JSON, content={
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
    },
    # perms={'accession.change_descriptortype': _('You are not allowed to modify a type of descriptor')},
    staff=True
)
def update_descriptor_type(request, id, tid):
    descr_type_params = request.data

    group_id = int_arg(id)
    group = get_object_or_404(DescriptorGroup, id=group_id)

    type_id = int_arg(tid)

    descr_type = get_object_or_404(DescriptorType, id=type_id, group=group)

    descr_type.name = descr_type_params['name']
    descr_type.format = json.dumps(descr_type_params['format'])

    count = descr_type.count_num_values()

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
    """
    Get the list of values for a given group and type of descriptor and according to the current language.

    :param id: Descriptor group id
    :param tid: Descriptor type id

    """
    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = request.GET.get('cursor')
    limit = results_per_page

    sort_by = request.GET.get('sort_by', 'id')

    group_id = int(id)
    type_id = int(tid)

    group = get_object_or_404(DescriptorGroup, id=group_id)
    descr_type = get_object_or_404(DescriptorType, id=type_id, group=group)

    if sort_by.startswith('-'):
        order_by = sort_by[1:]
        reverse = True
    elif sort_by.startswith('+'):
        order_by = sort_by[1:]
        reverse = False
    else:
        order_by = sort_by
        reverse = False

    prev_cursor, next_cursor, values_list = descr_type.get_values(order_by, reverse, cursor, limit)

    results = {
        'sort_by': sort_by,
        'prev': prev_cursor,
        'cursor': cursor,
        'next': next_cursor,
        'format': json.loads(descr_type.format),
        'items': values_list,
    }

    return HttpResponseRest(request, results)
