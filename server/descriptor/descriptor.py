# -*- coding: utf-8; -*-
#
# @file descriptor.py
# @brief coll-gate descriptor module, descriptor
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2016-09-01
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

import json

from django.core.exceptions import SuspiciousOperation
from django.db.models import Q, Count
from django.db.models.functions import Length
from django.shortcuts import get_object_or_404
from django.utils import translation
from django.utils.translation import ugettext_lazy as _
from django.views.decorators.cache import cache_page

from descriptor.descriptorformattype import DescriptorFormatTypeManager
from igdectk.common.helpers import int_arg
from igdectk.rest import Format, Method
from igdectk.rest.response import HttpResponseRest
from igdectk.rest.handler import RestHandler

from main.cursor import CursorQuery
from main.models import InterfaceLanguages
from .models import Descriptor, DescriptorValue


class RestDescriptor(RestHandler):
    regex = r'^descriptor/$'
    name = 'descriptor'


class RestDescriptorDescriptor(RestDescriptor):
    regex = r'^descriptor/$'
    suffix = 'descriptor'


class RestDescriptorDescriptorGroup(RestDescriptorDescriptor):
    regex = r'^group/$'
    suffix = 'group'


class RestDescriptorDescriptorCount(RestDescriptorDescriptor):
    regex = r'^count/$'
    suffix = 'count'


class RestDescriptorDescriptorId(RestDescriptorDescriptor):
    regex = r'^(?P<typ_id>[0-9]+)/$'
    suffix = 'id'


class RestDescriptorDescriptorSearch(RestDescriptorDescriptor):
    regex = r'^search/$'
    suffix = 'search'


class RestDescriptorDescriptorIdValue(RestDescriptorDescriptorId):
    regex = r'^value/$'
    suffix = 'value'


class RestDescriptorDescriptorIdValueId(RestDescriptorDescriptorIdValue):
    regex = r'^(?P<val_id>[a-zA-Z0-9:_\.]+)/$'
    suffix = 'id'


class RestDescriptorNameValuesList(RestDescriptor):
    regex = r'^descriptor-values-list/(?P<dmt_name>[a-zA-Z0-9\-\_\.]+)/$'
    suffix = 'search'

# class RestDescriptorType(RestDescriptor):
#     regex = r'^type/$'
#     suffix = 'type'
#
#
# class RestDescriptorTypeId(RestDescriptorType):
#     regex = r'^(?P<typ_id>[0-9]+)/$'
#     suffix = 'id'
#
#
# class RestDescriptorTypeIdValue(RestDescriptorTypeId):
#     regex = r'^value/$'
#     suffix = 'value'
#
#
# class RestDescriptorTypeIdValueDisplay(RestDescriptorTypeIdValue):
#     regex = r'^display/$'
#     suffix = 'display'
#
#
# class RestDescriptorTypeIdValueDisplaySearch(RestDescriptorTypeIdValueDisplay):
#     regex = r'^search/$'
#     suffix = 'search'
#
#
# class RestDescriptorTypeIdValueId(RestDescriptorTypeIdValue):
#     regex = r'^(?P<val_id>[a-zA-Z0-9:_\.]+)/$'
#     suffix = 'id'
#
#
# class RestDescriptorTypeIdValueIdField(RestDescriptorTypeIdValueId):
#     regex = r'^(?P<field>value0|value1)/$'
#     suffix = 'field'
#
#
# class RestDescriptorTypeIdValueIdDisplay(RestDescriptorTypeIdValueId):
#     regex = r'^display/$'
#     suffix = 'display'
#
#
# class RestDescriptorGroup(RestDescriptor):
#     regex = r'^group/$'
#     suffix = 'group'
#
#
# class RestDescriptorGroupCount(RestDescriptorGroup):
#     regex = r'^count/$'
#     suffix = 'count'
#
#
# class RestDescriptorGroupSearch(RestDescriptorGroup):
#     regex = r'^search/$'
#     suffix = 'search'
#
#
# class RestDescriptorGroupId(RestDescriptorGroup):
#     regex = r'^(?P<grp_id>[0-9]+)/$'
#     suffix = 'id'


# class RestDescriptorGroupIdTypeIdValue(RestDescriptorGroupIdTypeId):
#     regex = r'^value/$'
#     suffix = 'value'


# class RestDescriptorGroupIdTypeIdValueDisplay(RestDescriptorGroupIdTypeIdValue):
#     regex = r'^display/$'
#     suffix = 'display'


# class RestDescriptorGroupIdTypeIdValueDisplaySearch(RestDescriptorGroupIdTypeIdValueDisplay):
#     regex = r'^search/$'
#     suffix = 'search'


# class RestDescriptorGroupIdTypeIdValueId(RestDescriptorGroupIdTypeIdValue):
#     regex = r'^(?P<val_id>[a-zA-Z0-9:_\.]+)/$'
#     suffix = 'id'


# class RestDescriptorGroupIdTypeIdValueIdField(RestDescriptorGroupIdTypeIdValueId):
#     regex = r'^(?P<field>value0|value1)/$'
#     suffix = 'field'
#
#
# class RestDescriptorGroupIdTypeIdValueIdDisplay(RestDescriptorGroupIdTypeIdValueId):
#     regex = r'^display/$'
#     suffix = 'display'


@RestDescriptorDescriptorGroup.def_auth_request(Method.GET, Format.JSON)
def get_group_list(request):
    group_list = Descriptor.objects.values_list('group_name').distinct()

    items = []

    for group_name in group_list:
        g = {
            'group_name': group_name
        }

        items.append(g)

    results = {
        'perms': [],
        'items': items,
        # 'prev': cq.prev_cursor,
        # 'cursor': cursor,
        # 'next': cq.next_cursor,
    }

    return HttpResponseRest(request, results)


@RestDescriptorDescriptor.def_auth_request(Method.GET, Format.JSON)
def get_descriptor_list(request):
    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = json.loads(request.GET.get('cursor', 'null'))
    limit = results_per_page
    sort_by = json.loads(request.GET.get('sort_by', '[]'))

    if not len(sort_by) or sort_by[-1] not in ('id', '+id', '-id'):
        order_by = sort_by + ['id']
    else:
        order_by = sort_by

    cq = CursorQuery(Descriptor)

    if request.GET.get('filters'):
        cq.filter(json.loads(request.GET['filters']))

    if request.GET.get('search'):
        cq.filter(json.loads(request.GET['search']))

    cq.cursor(cursor, order_by)
    cq.order_by(order_by).limit(limit)

    items = []

    for descriptor in cq:
        d = {
            'id': descriptor.id,
            'name': descriptor.name,
            'code': descriptor.code,
            'label': descriptor.get_label(),
            'group_name': descriptor.group_name,
            'description': descriptor.description,
            'can_delete': descriptor.can_delete,
            'can_modify': descriptor.can_modify,
            'format': descriptor.format,
            'index': None  # todo: add index field to the descriptor model
        }

        items.append(d)

    results = {
        'perms': [],
        'items': items,
        'prev': cq.prev_cursor,
        'cursor': cursor,
        'next': cq.next_cursor,
    }

    return HttpResponseRest(request, results)


@RestDescriptorDescriptorCount.def_auth_request(Method.GET, Format.JSON)
def get_descriptor_list_count(request):
    """
    Get the count of number of descriptors in JSON
    """

    cq = CursorQuery(Descriptor)

    if request.GET.get('filters'):
        cq.filter(json.loads(request.GET['filters']))

    if request.GET.get('search'):
        cq.filter(json.loads(request.GET['search']))

    results = {
        'perms': [],
        'count': cq.count()
    }

    return HttpResponseRest(request, results)


@RestDescriptorDescriptorId.def_auth_request(Method.GET, Format.JSON)
def get_descriptor(request, typ_id):
    descriptor = get_object_or_404(Descriptor, id=int(typ_id))

    count = descriptor.count_num_values()

    response = {
        'id': descriptor.id,
        'name': descriptor.name,
        'code': descriptor.code,
        'label': descriptor.label,
        'description': descriptor.description,
        'group_name': descriptor.group_name,
        'num_descriptor_values': count,
        'format': descriptor.format,
        'can_delete': descriptor.can_delete,
        'can_modify': descriptor.can_modify
    }

    return HttpResponseRest(request, response)


# @RestDescriptorGroup.def_auth_request(Method.GET, Format.JSON)
# def get_descriptor_group_list(request):
#     """
#     Descriptor group name is indexed.
#     """
#
#     # todo: deprecated function | use the function get descriptor list and select the field "group_name"
#
#     results_per_page = int_arg(request.GET.get('more', 30))
#     cursor = json.loads(request.GET.get('cursor', 'null'))
#     limit = results_per_page
#     sort_by = json.loads(request.GET.get('sort_by', '[]'))
#
#     if not len(sort_by) or sort_by[-1] not in ('id', '+id', '-id'):
#         order_by = sort_by + ['id']
#     else:
#         order_by = sort_by
#
#     cq = CursorQuery(Descriptor)
#     cq.cursor(cursor, order_by)
#     cq.order_by(order_by).limit(limit)
#
#     group_list = []
#     for descriptor in cq:
#         group_list.append({
#             'name': descriptor.group_name,
#         })
#
#     results = {
#         'perms': [],
#         'items': group_list,
#         'prev': cq.prev_cursor,
#         'cursor': cursor,
#         'next': cq.next_cursor
#     }
#
#     return HttpResponseRest(request, results)

# """
# Descriptor group name is unique and indexed.
# """
# results_per_page = int_arg(request.GET.get('more', 30))
# cursor = json.loads(request.GET.get('cursor', 'null'))
# limit = results_per_page
# sort_by = json.loads(request.GET.get('sort_by', '[]'))
#
# if not len(sort_by) or sort_by[-1] not in ('id', '+id', '-id'):
#     order_by = sort_by + ['id']
# else:
#     order_by = sort_by
#
# cq = CursorQuery(DescriptorGroup)
#
# if request.GET.get('search'):
#     search = json.loads(request.GET['search'])
#     cq.filter(search)
#
# if request.GET.get('filters'):
#     filters = json.loads(request.GET['filters'])
#     cq.filter(filters)
#
# cq.cursor(cursor, order_by)
# cq.order_by(order_by).limit(limit)
# cq.set_count('types_set')
#
# group_list = []
# for group in cq:
#     group_list.append({
#         'id': group.pk,
#         'name': group.name,
#         'num_descriptor_types': group.types_set__count,
#         'can_delete': group.can_delete,
#         'can_modify': group.can_modify
#     })
#
# results = {
#     'perms': [],
#     'items': group_list,
#     'prev': cq.prev_cursor,
#     'cursor': cursor,
#     'next': cq.next_cursor
# }
#
# return HttpResponseRest(request, results)


# @RestDescriptorGroupCount.def_auth_request(Method.GET, Format.JSON)
# def get_descriptor_group_list_count(request):
#     """
#     Get the count of number of group of descriptors in JSON
#     """
#     cq = CursorQuery(Descriptor)
#     cq.order_by('group_name').distinct()
#
#     results = {
#         'perms': [],
#         'count': cq.count()
#     }
#
#     return HttpResponseRest(request, results)


# @RestDescriptorGroup.def_auth_request(
#     Method.POST, Format.JSON, content={
#         "type": "object",
#         "properties": {
#             "name": DescriptorType.NAME_VALIDATOR
#         },
#     },
#     perms={'descriptor.add_descriptorgroup': _('You are not allowed to create a group of descriptors')},
#     staff=True
# )
# def create_descriptor_group(request):
#     group_params = request.data
#
#     group = DescriptorGroup.objects.create(
#         name=group_params['name'],
#         can_delete=True,
#         can_modify=True)
#
#     response = {
#         'id': group.id,
#         'name': group.name,
#         'num_descriptor_types': 0,
#         'can_delete': group.can_delete,
#         'can_modify': group.can_modify
#     }
#
#     return HttpResponseRest(request, response)


# @RestDescriptorGroupId.def_auth_request(
#     Method.DELETE, Format.JSON,
#     perms={
#         'descriptor.delete_descriptorgroup': _("You are not allowed to delete a group of descriptors"),
#     },
#     staff=True
# )
# def delete_descriptor_group(request, grp_id):
#     group = get_object_or_404(DescriptorGroup, id=int(grp_id))
#
#     if group.types_set.count() > 0:
#         raise SuspiciousOperation(_("Only an empty group of descriptors can be deleted"))
#
#     group.delete()
#
#     return HttpResponseRest(request, {})


# @RestDescriptorGroupId.def_auth_request(
#     Method.PATCH, Format.JSON, content={
#         "type": "object",
#         "properties": {
#             "name": DescriptorGroup.NAME_VALIDATOR_OPTIONAL
#         },
#     },
#     perms={
#         'descriptor.change_descriptorgroup': _("You are not allowed to modify a group of descriptors"),
#     },
#     staff=True
# )
# def patch_descriptor_group(request, grp_id):
#     group = get_object_or_404(DescriptorGroup, id=int(grp_id))
#     group_name = request.data.get('name')
#
#     update = False
#     result = {'id': group.pk}
#
#     if not group.can_modify:
#         raise SuspiciousOperation(_("It is not permit to modify this group of type of descriptors"))
#
#     if group_name and group_name != group.name:
#         if DescriptorGroup.objects.filter(name__exact=group_name).exists():
#             raise SuspiciousOperation(_("Name of group of descriptor already in usage"))
#
#         group.name = group_name
#         group.full_clean()
#         result['name'] = group.name
#
#         update = True
#
#     if update:
#         group.save()
#
#     return HttpResponseRest(request, result)


@RestDescriptorDescriptorSearch.def_auth_request(Method.GET, Format.JSON, ('filters',), staff=True)
def search_descriptor(request):
    """
    Filters descriptors by name.
    @todo could needs pagination
    """
    filters = json.loads(request.GET['filters'])
    page = int_arg(request.GET.get('page', 1))

    descriptors = None

    if filters['method'] == 'ieq' and 'name' in filters['fields']:
        descriptors = Descriptor.objects.filter(name__iexact=filters['name'])
    elif filters['method'] == 'icontains' and 'name' in filters['fields']:
        descriptors = Descriptor.objects.filter(name__icontains=filters['name'])

    # descriptors = descriptors.annotate(Count('types_set'))

    descriptors_list = []

    if descriptors:
        for descriptor in descriptors:
            descriptors_list.append({
                'id': descriptor.id,
                'name': descriptor.name,
                'code': descriptor.code,
                'label': descriptor.get_label(),
                'group_name': descriptor.group_name,
                'description': descriptor.description,
                'can_delete': descriptor.can_delete,
                'can_modify': descriptor.can_modify,
                'format': descriptor.format,
                'index': None  # todo: add index field to the descriptor model
            })

    response = {
        'items': descriptors_list,
        'page': page
    }

    return HttpResponseRest(request, response)


@RestDescriptorDescriptorId.def_auth_request(
    Method.DELETE, Format.JSON,
    perms={
        'descriptor.delete_descriptor': _("You are not allowed to delete a descriptor"),
    },
    staff=True
)
def delete_descriptor_type_for_group(request, typ_id):
    descriptor = get_object_or_404(Descriptor, id=int(typ_id))

    # todo: Check if the descriptor has values and it's used
    # if descriptor.has_values():
    #     raise SuspiciousOperation(_("Only an empty of values type of descriptor can be deleted"))
    #
    # if descriptor.in_usage():
    #     raise SuspiciousOperation(_("Only unused types of descriptor can be deleted"))

    descriptor.delete()

    return HttpResponseRest(request, {})
# @RestDescriptorGroupId.def_auth_request(Method.GET, Format.JSON)
# def get_descriptor_groups(request, grp_id):
#     group = get_object_or_404(DescriptorGroup, id=int(grp_id))
#
#     response = {
#         'id': group.id,
#         'name': group.name,
#         'can_delete': group.can_delete,
#         'can_modify': group.can_modify,
#         'num_descriptor_types': group.types_set.all().count()
#     }
#
#     return HttpResponseRest(request, response)
#
#
# @RestDescriptorGroupIdType.def_auth_request(Method.GET, Format.JSON)
# def get_descriptor_types_for_group(request, grp_id):
#     results_per_page = int_arg(request.GET.get('more', 30))
#     cursor = json.loads(request.GET.get('cursor', 'null'))
#     limit = results_per_page
#     sort_by = json.loads(request.GET.get('sort_by', '["name"]'))
#     order_by = sort_by
#
#     group = get_object_or_404(DescriptorGroup, id=int(grp_id))
#
#     cq = CursorQuery(DescriptorType)
#
#     cq.filter(group=group.pk)
#
#     if request.GET.get('search'):
#         search = json.loads(request.GET['search'])
#         cq.filter(search)
#
#     if request.GET.get('filters'):
#         filters = json.loads(request.GET['filters'])
#         cq.filter(filters)
#
#     cq.cursor(cursor, order_by)
#     cq.order_by(order_by).limit(limit)
#
#     dt_items = []
#
#     for descr_type in cq:
#         # can add an extra query per row
#         count = descr_type.count_num_values()
#
#         dt_items.append({
#             'id': descr_type.pk,
#             'group': group.pk,
#             'name': descr_type.name,
#             'code': descr_type.code,
#             'description': descr_type.description,
#             'num_descriptor_values': count,
#             'can_delete': descr_type.can_delete,
#             'can_modify': descr_type.can_modify,
#             'format': descr_type.format
#         })
#
#     results = {
#         'perms': [],
#         'items': dt_items,
#         'prev': cq.prev_cursor,
#         'cursor': cursor,
#         'next': cq.next_cursor
#     }
#
#     return HttpResponseRest(request, results)
#
#
# @RestDescriptorGroupIdTypeSearch.def_auth_request(Method.GET, Format.JSON, ('filters',), staff=True)
# def search_descriptor_types_for_group(request, grp_id):
#     """
#     Filters the type of descriptors by name for a specific group.
#     """
#     filters = json.loads(request.GET['filters'])
#     page = int_arg(request.GET.get('page', 1))
#
#     group = get_object_or_404(DescriptorGroup, id=int(grp_id))
#     descr_types = None
#
#     if filters['method'] == 'ieq' and 'name' in filters['fields']:
#         descr_types = DescriptorType.objects.filter(group=group, name__iexact=filters['name'])
#     elif filters['method'] == 'icontains' and 'name' in filters['fields']:
#         descr_types = DescriptorGroup.objects.filter(group=group, name__icontains=filters['name'])
#
#     descr_types_list = []
#
#     if descr_types is not None:
#         for descr_type in descr_types:
#             # can add one query per descriptor type
#             count = descr_type.count_num_values()
#
#             descr_types_list.append({
#                 'id': descr_type.id,
#                 'name': descr_type.name,
#                 'code': descr_type.code,
#                 'description': descr_type.description,
#                 'group': group.id,
#                 'num_descriptor_values': count,
#                 'format': descr_type.format,
#                 'can_delete': descr_type.can_delete,
#                 'can_modify': descr_type.can_modify
#             })
#
#     response = {
#         'items': descr_types_list,
#         'page': page
#     }
#
#     return HttpResponseRest(request, response)


# @RestDescriptorGroupIdTypeId.def_auth_request(Method.GET, Format.JSON)
# def get_descriptor_type_for_group(request, grp_id, typ_id):
#     group = get_object_or_404(DescriptorGroup, id=int(grp_id))
#     descr_type = get_object_or_404(DescriptorType, id=int(typ_id), group=group)
#
#     count = descr_type.count_num_values()
#
#     response = {
#         'id': descr_type.id,
#         'name': descr_type.name,
#         'code': descr_type.code,
#         'description': descr_type.description,
#         'group': group.id,
#         'num_descriptor_values': count,
#         'format': descr_type.format,
#         'can_delete': descr_type.can_delete,
#         'can_modify': descr_type.can_modify
#     }
#
#     return HttpResponseRest(request, response)


@RestDescriptorDescriptor.def_auth_request(
    Method.POST, Format.JSON, content={
        "type": "object",
        "properties": {
            "name": Descriptor.NAME_VALIDATOR,
            # "group_name": Descriptor.NAME_VALIDATOR,
            # "code": {"type": "string", 'minLength': 3, 'maxLength': 32},
            "description": {"type": "string", 'maxLength': 1024, 'blank': True},
            "format": {
                "type": "object",
                "properties": {
                    "type": {"type": "string", 'minLength': 1, 'maxLength': 32},
                },
                "additionalProperties": True
            }
        },
    },
    perms={
        'descriptor.add_descriptor': _('You are not allowed to create a descriptor')
    },
    staff=True
)
def create_descriptor(request):
    descriptor_params = request.data

    # generate a new internal code base on previous max ID_xxx
    qs = Descriptor.objects.filter(code__startswith='ID_').order_by(Length('code').desc(), '-code')[:1]
    if qs.exists():
        suffix = int(qs[0].code.split('_')[1]) + 1
    else:
        suffix = 1

    code = 'ID_%03i' % suffix

    descriptor = Descriptor.objects.create(
        name=descriptor_params['name'],
        code=code,
        group_name=descriptor_params['group_name'],
        can_delete=True,
        can_modify=True
    )

    response = {
        'id': descriptor.id,
        'name': descriptor.name,
        'code': descriptor.code,
        'description': descriptor.description,
        'group_name': descriptor.group_name,
        'num_descriptor_values': 0,
        'can_delete': descriptor.can_delete,
        'can_modify': descriptor.can_modify
    }

    return HttpResponseRest(request, response)


@RestDescriptorDescriptorId.def_auth_request(
    Method.PUT, Format.JSON, content={
        "type": "object",
        "properties": {
            "name": Descriptor.NAME_VALIDATOR,
            "code": {"type": "string", 'minLength': 3, 'maxLength': 32},
            "description": {"type": "string", 'maxLength': 1024, 'blank': True},
            "format": {
                "type": "object",
                "properties": {
                    "type": {"type": "string", 'minLength': 1, 'maxLength': 32},
                },
                "additionalProperties": True
            }
        },
    },
    perms={
        'descriptor.change_descriptor': _('You are not allowed to modify a descriptor')
    },
    staff=True
)
def update_descriptor(request, typ_id):
    descriptor_params = request.data
    format_type = descriptor_params['format']
    description = request.data['description']

    descriptor = get_object_or_404(Descriptor, id=int(typ_id))
    org_format = descriptor.format

    if not descriptor.can_modify:
        raise SuspiciousOperation(_("It is not permit to modify this descriptor"))

    # @todo check if there is some values and used descriptor... inconsistency of the describables in DB
    # may we test if the descriptor type is mapped into descriptor layout, and if these descriptor layout
    # have data ?

    # format validation
    DescriptorFormatTypeManager.check(format_type)

    # @todo must be operated by DescriptorFormatType
    # had values -> has no values
    if not format_type['type'].startswith('enum_') and org_format['type'].startswith('enum_'):
        # overwrite values
        descriptor.values = None
        descriptor.values_set.all().delete()

    # single enumeration
    if format_type['type'] == 'enum_single':
        # reset if type or translation differs
        if org_format['type'] != 'enum_single' or format_type['trans'] != org_format.get('trans', False):
            # reset values
            descriptor.values = None
            descriptor.values_set.all().delete()

    # pair enumeration
    elif format_type['type'] == 'enum_pair':
        # reset if type or translation differs
        if org_format['type'] != 'enum_pair' or format_type['trans'] != org_format.get('trans', False):
            # reset values
            descriptor.values = None
            descriptor.values_set.all().delete()

    # ordinal enumeration
    elif format_type['type'] == 'enum_ordinal':
        # range as integer in this case
        org_min_range, org_max_range = [int(x) for x in org_format.get('range', ['0', '0'])]
        min_range, max_range = [int(x) for x in format_type['range']]

        # reset values because it changes of type
        if org_format['type'] != 'enum_ordinal':
            descriptor.values = None
            descriptor.values_set.all().delete()

        # regenerate values only if difference in range or translation
        if org_min_range != min_range or org_max_range != max_range or format_type['trans'] != org_format.get('trans',
                                                                                                              False):
            values = {}

            i = 1  # begin to 1

            # translation mean a dict of dict
            if format_type['trans']:
                for lang in InterfaceLanguages.choices():
                    lvalues = {}

                    for ordinal in range(min_range, max_range + 1):
                        code = "%s:%07i" % (descriptor.code, i)
                        lvalues[code] = {'ordinal': ordinal, 'value0': 'Undefined(%i)' % ordinal}
                        i += 1

                    values[lang[0]] = lvalues
            else:
                for ordinal in range(min_range, max_range + 1):
                    code = "%s:%07i" % (descriptor.code, i)
                    values[code] = {'ordinal': ordinal, 'value0': 'Undefined(%i)' % ordinal}
                    i += 1

            descriptor.values = values

    descriptor.name = descriptor_params['name']
    descriptor.format = format_type
    descriptor.description = description

    count = descriptor.count_num_values()

    descriptor.save()

    response = {
        'id': descriptor.id,
        'name': descriptor.name,
        'label': descriptor.get_label(),
        'code': descriptor.code,
        'description': descriptor.description,
        'format': descriptor.format,
        'group_name': descriptor.group_name,
        'num_descriptor_values': count,
        'can_delete': descriptor.can_delete,
        'can_modify': descriptor.can_modify
    }

    return HttpResponseRest(request, response)


@RestDescriptorDescriptorIdValue.def_auth_request(Method.GET, Format.JSON)
def get_descriptor_values(request, typ_id):
    """
    Get the list of values for a given descriptor and according to the current language.
    """
    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = request.GET.get('cursor')
    limit = results_per_page

    sort_by = request.GET.get('sort_by', 'id')

    descriptor = get_object_or_404(Descriptor, id=int(typ_id))

    if sort_by.startswith('-'):
        order_by = sort_by[1:]
        reverse = True
    elif sort_by.startswith('+'):
        order_by = sort_by[1:]
        reverse = False
    else:
        order_by = sort_by
        reverse = False

    prev_cursor, next_cursor, values_list = descriptor.get_values(order_by, reverse, cursor, limit)

    results = {
        'sort_by': sort_by,
        'prev': prev_cursor,
        'cursor': cursor,
        'next': next_cursor,
        'format': descriptor.format,
        'items': values_list,
    }

    return HttpResponseRest(request, results)


# @RestDescriptorDescriptorIdValue.def_auth_request(Method.GET, Format.JSON)
# def get_descriptor_values(request, typ_id):
#     """
#     Get the list of values for a given descriptor and according to the current language.
#     """
#     results_per_page = int_arg(request.GET.get('more', 30))
#     cursor = json.loads(request.GET.get('cursor', 'null'))
#     limit = results_per_page
#     sort_by = json.loads(request.GET.get('sort_by', '[]'))
#
#     if not len(sort_by) or sort_by[-1] not in ('id', '+id', '-id'):
#         order_by = sort_by + ['id']
#     else:
#         order_by = sort_by
#
#     cq = CursorQuery(DescriptorValue)
#
#     if request.GET.get('filters'):
#         cq.filter(json.loads(request.GET['filters']))
#
#     if request.GET.get('search'):
#         cq.filter(json.loads(request.GET['search']))
#
#     cq.cursor(cursor, order_by)
#     cq.order_by(order_by).limit(limit)
#
#     items = []
#
#     for descriptor in cq:
#         d = {
#             'id': descriptor.id,
#             'name': descriptor.name,
#             'code': descriptor.code,
#             'label': descriptor.get_label(),
#             'group_name': descriptor.group_name,
#             'description': descriptor.description,
#             'can_delete': descriptor.can_delete,
#             'can_modify': descriptor.can_modify,
#             'format': descriptor.format,
#             'index': None  # todo: add index field to the descriptor model
#         }
#
#         items.append(d)
#
#     results = {
#         'perms': [],
#         'items': items,
#         'prev': cq.prev_cursor,
#         'cursor': cursor,
#         'next': cq.next_cursor,
#         'format': descriptor.format,
#     }
#
#     return HttpResponseRest(request, results)
#
#
# @RestDescriptorGroupIdTypeId.def_auth_request(
#     Method.PUT, Format.JSON, content={
#         "type": "object",
#         "properties": {
#             "name": Descriptor.NAME_VALIDATOR,
#             "code": {"type": "string", 'minLength': 3, 'maxLength': 32},
#             "description": {"type": "string", 'maxLength': 1024, 'blank': True},
#             "format": {
#                 "type": "object",
#                 "properties": {
#                     "type": {"type": "string", 'minLength': 1, 'maxLength': 32},
#                 },
#                 "additionalProperties": True
#             }
#         },
#     },
#     perms={
#         'descriptor.change_descriptorgroup': _('You are not allowed to modify a group of types of descriptors'),
#         'descriptor.change_descriptortype': _('You are not allowed to modify a type of descriptor')
#     },
#     staff=True
# )
# def update_descriptor_type(request, typ_id):
#     descr_type_params = request.data
#     format_type = descr_type_params['format']
#     description = request.data['description']
#
#     descr_type = get_object_or_404(Descriptor, id=int(typ_id))
#     org_format = descr_type.format
#
#     if not descr_type.can_modify:
#         raise SuspiciousOperation(_("It is not permit to modify this type of descriptor"))
#
#     # @todo check if there is some values and used descriptor type... inconsistency of the describables in DB
#     # may we test if the descriptor type is mapped into descriptor model type, and if these descriptor model type
#     # have data ?
#
#     # format validation
#     DescriptorFormatTypeManager.check(format_type)
#
#     # @todo must be operated by DescriptorFormatType
#     # had values -> has no values
#     if not format_type['type'].startswith('enum_') and org_format['type'].startswith('enum_'):
#         # overwrite values
#         descr_type.values = None
#         descr_type.values_set.all().delete()
#
#     # single enumeration
#     if format_type['type'] == 'enum_single':
#         # reset if type or translation differs
#         if org_format['type'] != 'enum_single' or format_type['trans'] != org_format.get('trans', False):
#             # reset values
#             descr_type.values = None
#             descr_type.values_set.all().delete()
#
#     # pair enumeration
#     elif format_type['type'] == 'enum_pair':
#         # reset if type or translation differs
#         if org_format['type'] != 'enum_pair' or format_type['trans'] != org_format.get('trans', False):
#             # reset values
#             descr_type.values = None
#             descr_type.values_set.all().delete()
#
#     # ordinal enumeration
#     elif format_type['type'] == 'enum_ordinal':
#         # range as integer in this case
#         org_min_range, org_max_range = [int(x) for x in org_format.get('range', ['0', '0'])]
#         min_range, max_range = [int(x) for x in format_type['range']]
#
#         # reset values because it changes of type
#         if org_format['type'] != 'enum_ordinal':
#             descr_type.values = None
#             descr_type.values_set.all().delete()
#
#         # regenerate values only if difference in range or translation
#         if org_min_range != min_range or org_max_range != max_range or format_type['trans'] != org_format.get('trans',
#                                                                                                               False):
#             values = {}
#
#             i = 1  # begin to 1
#
#             # translation mean a dict of dict
#             if format_type['trans']:
#                 for lang in InterfaceLanguages.choices():
#                     lvalues = {}
#
#                     for ordinal in range(min_range, max_range + 1):
#                         code = "%s:%07i" % (descr_type.code, i)
#                         lvalues[code] = {'ordinal': ordinal, 'value0': 'Undefined(%i)' % ordinal}
#                         i += 1
#
#                     values[lang[0]] = lvalues
#             else:
#                 for ordinal in range(min_range, max_range + 1):
#                     code = "%s:%07i" % (descr_type.code, i)
#                     values[code] = {'ordinal': ordinal, 'value0': 'Undefined(%i)' % ordinal}
#                     i += 1
#
#             descr_type.values = values
#
#     descr_type.name = descr_type_params['name']
#     descr_type.format = format_type
#     descr_type.description = description
#
#     count = descr_type.count_num_values()
#
#     descr_type.save()
#
#     response = {
#         'id': descr_type.id,
#         'name': descr_type.name,
#         'code': descr_type.code,
#         'description': descr_type.description,
#         'format': descr_type.format,
#         'group_name': descr_type.group_name,
#         'num_descriptor_values': count,
#         'can_delete': descr_type.can_delete,
#         'can_modify': descr_type.can_modify
#     }
#
#     return HttpResponseRest(request, response)
#
#
# @RestDescriptorGroupIdTypeIdValue.def_auth_request(Method.GET, Format.JSON)
# def get_descriptor_values_for_group_and_type(request, typ_id):
#     """
#     Get the list of values for a given group and type of descriptor and according to the current language.
#     """
#     results_per_page = int_arg(request.GET.get('more', 30))
#     cursor = request.GET.get('cursor')
#     limit = results_per_page
#
#     sort_by = request.GET.get('sort_by', 'id')
#
#     descr_type = get_object_or_404(Descriptor, id=int(typ_id))
#
#     if sort_by.startswith('-'):
#         order_by = sort_by[1:]
#         reverse = True
#     elif sort_by.startswith('+'):
#         order_by = sort_by[1:]
#         reverse = False
#     else:
#         order_by = sort_by
#         reverse = False
#
#     prev_cursor, next_cursor, values_list = descr_type.get_values(order_by, reverse, cursor, limit)
#
#     results = {
#         'sort_by': sort_by,
#         'prev': prev_cursor,
#         'cursor': cursor,
#         'next': next_cursor,
#         'format': descr_type.format,
#         'items': values_list,
#     }
#
#     return HttpResponseRest(request, results)
#
#
# @RestDescriptorTypeIdValue.def_auth_request(Method.GET, Format.JSON)
# def get_descriptor_values_for_type(request, typ_id):
#     """
#     Get the list of values for a given type of descriptor and according to the current language.
#     """
#     results_per_page = int_arg(request.GET.get('more', 30))
#     cursor = request.GET.get('cursor')
#     limit = results_per_page
#
#     sort_by = request.GET.get('sort_by', 'id')
#
#     descr_type = get_object_or_404(Descriptor, id=int(typ_id))
#
#     if sort_by.startswith('-'):
#         order_by = sort_by[1:]
#         reverse = True
#     elif sort_by.startswith('+'):
#         order_by = sort_by[1:]
#         reverse = False
#     else:
#         order_by = sort_by
#         reverse = False
#
#     prev_cursor, next_cursor, values_list = descr_type.get_values(order_by, reverse, cursor, limit)
#
#     results = {
#         'sort_by': sort_by,
#         'prev': prev_cursor,
#         'cursor': cursor,
#         'next': next_cursor,
#         'format': descr_type.format,
#         'items': values_list,
#     }
#
#     return HttpResponseRest(request, results)
#
#
# @RestDescriptorGroupIdTypeIdValue.def_auth_request(
#     Method.POST, Format.JSON, content={
#         "type": "object",
#         "properties": {
#             "parent": {'type': ['string', 'null'], 'minLength': 6, 'maxLength': 32, "required": False},
#             "ordinal": {'type': ['number', 'null'], "required": False},
#             "value0": {'type': 'string', 'minLength': 1, 'maxLength': 32},
#             "value1": {'type': ['string', 'null'], 'minLength': 1, 'maxLength': 32, "required": False}
#         },
#     },
#     perms={
#         'descriptor.change_descriptortype': _('You are not allowed to modify a type of descriptor'),
#         'descriptor.create_descriptorvalue': _('You are not allowed to create a value of descriptor')
#     },
#     staff=True
# )
# def create_descriptor_values_for_type(request, typ_id):
#     """
#     Create and insert at last a new value for a type of descriptor.
#     """
#     descr_type = get_object_or_404(Descriptor, id=int(typ_id))
#
#     qs = descr_type.values_set.all().order_by('-code')[:1]
#     if qs.exists():
#         suffix = int(qs[0].code.split(':')[1]) + 1
#     else:
#         suffix = 1
#
#     code = '%s:%07i' % (descr_type.code, suffix)
#
#     format_type = descr_type.format
#
#     if format_type.get('trans', False):
#         for lang in InterfaceLanguages.choices():
#             dv = DescriptorValue()
#
#             dv.descriptor = descr_type
#
#             dv.language = lang[0]
#             dv.code = code
#             dv.parent = request.data.get('parent')
#             dv.ordinal = request.data.get('ordinal')
#             dv.value0 = request.data.get('value0')
#             dv.value1 = request.data.get('value1')
#
#             dv.save()
#     else:
#         dv = DescriptorValue()
#
#         dv.descriptor = descr_type
#
#         dv.code = code
#         dv.parent = request.data.get('parent')
#         dv.ordinal = request.data.get('ordinal')
#         dv.value0 = request.data.get('value0')
#         dv.value1 = request.data.get('value1')
#
#         dv.save()
#
#     result = {
#         'id': code,
#         'parent': request.data.get('parent'),
#         'ordinal': request.data.get('ordinal'),
#         'value0': request.data.get('value0'),
#         'value1': request.data.get('value1')
#     }
#
#     return HttpResponseRest(request, result)
#
#
# @RestDescriptorGroupIdTypeIdValueId.def_auth_request(
#     Method.PATCH, Format.JSON,
#     content={
#         "type": "object",
#         "properties": {
#             "value0": {"type": "string", 'minLength': 3, 'maxLength': 32, 'required': False},
#             "value1": {"type": "string", 'minLength': 3, 'maxLength': 32, 'required': False},
#             "ordinal": {"type": "number", 'required': False},
#         },
#     },
#     perms={
#         'descriptor.change_descriptortype': _('You are not allowed to modify a type of descriptor'),
#         'descriptor.change_descriptorvalue': _('You are not allowed to modify a value of type of descriptor'),
#     },
#     staff=True
# )
# def patch_value_for_descriptor_model(request, typ_id, val_id):
#     """
#     Patch the value for a specific model of descriptor.
#     The field can be 'ordinal', 'value0' or 'value1'.
#     """
#     descr_type = get_object_or_404(Descriptor, id=int(typ_id))
#
#     format_type = descr_type.format
#
#     if not format_type['type'].startswith("enum_"):
#         raise SuspiciousOperation(_("There is no values for this type of descriptor"))
#
#     ordinal = request.data.get('ordinal')
#     value0 = request.data.get('value0')
#     value1 = request.data.get('value1')
#
#     if ordinal is not None and format_type['type'] != 'enum_ordinal':
#         raise SuspiciousOperation(_("Ordinal field is only defined for enumeration with ordinal"))
#
#     if value1 is not None and format_type['type'] != 'enum_pair':
#         raise SuspiciousOperation(_("Second value field is only defined for enumeration of pairs"))
#
#     # data stored in type of descriptor
#     if descr_type.values is not None:
#         values = descr_type.values
#
#         if format_type.get('trans', False):
#             lang = translation.get_language()
#             lvalues = values[lang]
#         else:
#             lvalues = values
#
#         if ordinal is not None:
#             lvalues[val_id]['ordinal'] = ordinal
#         if value0 is not None:
#             lvalues[val_id]['value0'] = value0
#         if value1 is not None:
#             lvalues[val_id]['value1'] = value1
#
#         descr_type.values = values
#         descr_type.save()
#     else:
#         # data stored in table of values
#         if format_type.get('trans', False):
#             lang = translation.get_language()
#             descr_value = descr_type.values_set.get(code=val_id, language=lang)
#         else:
#             descr_value = descr_type.values_set.get(code=val_id)
#
#         if ordinal is not None:
#             descr_value.ordinal = ordinal
#         elif value0 is not None:
#             descr_value.value0 = value0
#         elif value1 is not None:
#             descr_value.value1 = value1
#
#         descr_value.save()
#
#     result = {
#         'code': val_id
#     }
#
#     if ordinal is not None:
#         result['ordinal'] = ordinal
#     elif value0 is not None:
#         result['value0'] = value0
#     elif value1 is not None:
#         result['value1'] = value1
#
#     return HttpResponseRest(request, result)
#
#
# @RestDescriptorGroupIdTypeIdValueId.def_auth_request(
#     Method.DELETE, Format.JSON,
#     perms={
#         'descriptor.change_descriptortype': _('You are not allowed to modify a type of descriptor'),
#         'descriptor.delete_descriptorvalue': _('You are not allowed to remove a value of type of descriptor'),
#     },
#     staff=True
# )
# def delete_value_for_descriptor_type(request, typ_id, val_id):
#     """
#     Delete a single value for a type of descriptor.
#     """
#     descr_type = get_object_or_404(Descriptor, id=int(typ_id))
#     dmts = descr_type.descriptor_model_types.all()
#
#     for dmt in dmts:
#         if dmt.descriptor_model.in_usage():
#             raise SuspiciousOperation(_("There is some data using the type of descriptor"))
#
#     format_type = descr_type.format
#
#     # internally stored values
#     if descr_type.values is not None:
#         values = descr_type.values
#
#         if format_type['trans']:
#             for lvalues in values:
#                 del lvalues[val_id]
#         else:
#             del values[val_id]
#
#         descr_type.values = values
#     else:
#         # table stored values
#         values = descr_type.values_set.filter(code=val_id)
#         values.delete()
#
#     return HttpResponseRest(request, {})
#
#

@RestDescriptorDescriptorIdValueId.def_auth_request(Method.GET, Format.JSON)
def get_value_for_descriptor(request, typ_id, val_id):
    """
    Get a single value for a descriptor.
    """
    descriptor = get_object_or_404(Descriptor, id=int(typ_id))
    value = descriptor.get_value(val_id)

    result = {
        'parent': value[0],
        'ordinal': value[1],
        'value0': value[2],
        'value1': value[3]
    }

    return HttpResponseRest(request, result)
#
#
# @RestDescriptorTypeIdValueId.def_auth_request(Method.GET, Format.JSON)
# def get_value_for_descriptor_type(request, typ_id, val_id):
#     """
#     Get a single value for a type of descriptor.
#     """
#     descr_type = get_object_or_404(Descriptor, id=int(typ_id))
#     value = descr_type.get_value(val_id)
#
#     result = {
#         'parent': value[0],
#         'ordinal': value[1],
#         'value0': value[2],
#         'value1': value[3]
#     }
#
#     return HttpResponseRest(request, result)
#
#
# @RestDescriptorGroupIdTypeIdValueIdDisplay.def_auth_request(Method.GET, Format.JSON)
# def get_display_value_for_descriptor_type_and_group(request, typ_id, val_id):
#     """
#     Get a single value for a type of descriptor.
#     """
#     descr_type = get_object_or_404(Descriptor, id=int(typ_id))
#
#     format_type = descr_type.format
#     list_type = format_type.get('list_type', '')
#
#     if not list_type:
#         raise SuspiciousOperation(_("This type of descriptor does not contains a list"))
#
#     value = descr_type.get_value(val_id)
#
#     if format_type['display_fields'] == 'value0':
#         result = {
#             'id': val_id,
#             'value': val_id,
#             'label': value[2]
#         }
#     elif format_type['display_fields'] == 'value1':
#         result = {
#             'id': val_id,
#             'value': val_id,
#             'label': value[3]
#         }
#     elif format_type['display_fields'] == 'value0-value1':
#         result = {
#             'id': val_id,
#             'value': val_id,
#             'label': "%s - %s" % (value[2], value[3])
#         }
#     elif format_type['display_fields'] == 'ordinal-value0':
#         result = {
#             'id': val_id,
#             'value': val_id,
#             'label': "%i - %s" % (value[1], value[2])
#         }
#     elif format_type['display_fields'] == 'hier0-value1':
#         shift_size = value[2].count('.')
#
#         result = {
#             'id': val_id,
#             'value': val_id,
#             'label': value[3],
#             'offset': shift_size
#         }
#     else:
#         result = {}
#
#     return HttpResponseRest(request, result)
#
#
# @RestDescriptorTypeIdValueIdDisplay.def_auth_request(Method.GET, Format.JSON)
# def get_display_value_for_descriptor_type(request, typ_id, val_id):
#     """
#     Get a single value for a type of descriptor.
#     """
#     descr_type = get_object_or_404(Descriptor, id=int(typ_id))
#
#     format_type = descr_type.format
#     list_type = format_type.get('list_type', '')
#
#     if not list_type:
#         raise SuspiciousOperation(_("This type of descriptor does not contains a list"))
#
#     value = descr_type.get_value(val_id)
#
#     if format_type['display_fields'] == 'value0':
#         result = {
#             'id': val_id,
#             'value': val_id,
#             'label': value[2]
#         }
#     elif format_type['display_fields'] == 'value1':
#         result = {
#             'id': val_id,
#             'value': val_id,
#             'label': value[3]
#         }
#     elif format_type['display_fields'] == 'value0-value1':
#         result = {
#             'id': val_id,
#             'value': val_id,
#             'label': "%s - %s" % (value[2], value[3])
#         }
#     elif format_type['display_fields'] == 'ordinal-value0':
#         result = {
#             'id': val_id,
#             'value': val_id,
#             'label': "%i - %s" % (value[1], value[2])
#         }
#     elif format_type['display_fields'] == 'hier0-value1':
#         shift_size = value[2].count('.')
#
#         result = {
#             'id': val_id,
#             'value': val_id,
#             'label': value[3],
#             'offset': shift_size
#         }
#     else:
#         result = {}
#
#     return HttpResponseRest(request, result)
#
#
# @RestDescriptorGroupIdTypeIdValueIdField.def_auth_request(
#     Method.GET, Format.JSON)
# def get_labels_for_descriptor_type_group_and_field(request, typ_id, val_id, field):
#     """
#     Get all translations for a specific field of a value of descriptor.
#     """
#     if field not in ('value0', 'value1'):
#         raise SuspiciousOperation(_('Field name must be value0 or value1'))
#
#     descr_type = get_object_or_404(Descriptor, id=int(typ_id))
#
#     format_type = descr_type.format
#
#     results = {}
#
#     # internally stored values
#     if descr_type.values is not None:
#         values = descr_type.values
#
#         if format_type['trans']:
#             for lang, lvalues in values.items():
#                 if lvalues.get(val_id):
#                     results[lang] = lvalues[val_id].get(field)
#         else:
#             results['en'] = values[val_id][field]
#     else:
#         # data stored in table of values
#         descr_values = descr_type.values_set.filter(code=val_id)
#
#         for v in descr_values:
#             if field == 'value0':
#                 results[v.language] = v.value0
#             elif field == 'value1':
#                 results[v.language] = v.value1
#
#     # complete with missing languages
#     for lang, lang_label in InterfaceLanguages.choices():
#         if lang not in results:
#             results[lang] = ""
#
#     return HttpResponseRest(request, results)
#
#
# @RestDescriptorTypeIdValueIdField.def_auth_request(
#     Method.GET, Format.JSON)
# def get_labels_for_descriptor_type_field(request, typ_id, val_id, field):
#     """
#     Get all translations for a specific field of a value of descriptor.
#     """
#     if field not in ('value0', 'value1'):
#         raise SuspiciousOperation(_('Field name must be value0 or value1'))
#
#     descr_type = get_object_or_404(Descriptor, id=int(typ_id))
#
#     format_type = descr_type.format
#
#     results = {}
#
#     # internally stored values
#     if descr_type.values is not None:
#         values = descr_type.values
#
#         if format_type['trans']:
#             for lang, lvalues in values.items():
#                 if lvalues.get(val_id):
#                     results[lang] = lvalues[val_id].get(field)
#         else:
#             results['en'] = values[val_id][field]
#     else:
#         # data stored in table of values
#         descr_values = descr_type.values_set.filter(code=val_id)
#
#         for v in descr_values:
#             if field == 'value0':
#                 results[v.language] = v.value0
#             elif field == 'value1':
#                 results[v.language] = v.value1
#
#     # complete with missing languages
#     for lang, lang_label in InterfaceLanguages.choices():
#         if lang not in results:
#             results[lang] = ""
#
#     return HttpResponseRest(request, results)
#
#
# @RestDescriptorGroupIdTypeIdValueIdField.def_auth_request(
#     Method.PUT, Format.JSON, content={
#
#     },
#     perms={
#         'descriptor.change_descriptortype': _('You are not allowed to modify a type of descriptor'),
#         'descriptor.change_descriptorvalue': _('You are not allowed to modify a value of type of descriptor'),
#     },
#     staff=True)
# def set_values_for_descriptor_type(request, typ_id, val_id, field):
#     """
#     Set many translations for a specific field of a value of descriptor.
#     """
#     if field not in ('value0', 'value1'):
#         raise SuspiciousOperation(_('Field name must be value0 or value1'))
#
#     descr_type = get_object_or_404(Descriptor, id=int(typ_id))
#
#     new_values = request.data
#
#     languages_values = [lang[0] for lang in InterfaceLanguages.choices()]
#
#     for lang, label in new_values.items():
#         if lang not in languages_values:
#             raise SuspiciousOperation(_("Unsupported language identifier"))
#
#     format_type = descr_type.format
#
#     # internally stored values
#     if descr_type.values is not None:
#         values = descr_type.values
#
#         if format_type['trans']:
#             for lang, lvalues in values.items():
#                 if lvalues.get(val_id):
#                     lvalues[val_id][field] = new_values[lang]
#         else:
#             values[val_id] = new_values['en']
#
#         descr_type.values = values
#
#         descr_type.update_field('values')
#         descr_type.save()
#     else:
#         # data stored in table of values
#         descr_values = descr_type.values_set.filter(code=val_id)
#
#         for v in descr_values:
#             if field == 'value0':
#                 descr_type.update_field('value0')
#                 v.value0 = new_values[v.language]
#             elif field == 'value1':
#                 descr_type.update_field('value1')
#                 v.value1 = new_values[v.language]
#
#             v.save()
#
#     lang = translation.get_language()
#
#     results = {
#         'value': new_values[lang]
#     }
#
#     return HttpResponseRest(request, results)
#
#
# @cache_page(60 * 60 * 24)
# @RestDescriptorGroupIdTypeIdValueDisplay.def_auth_request(Method.GET, Format.JSON)
# def get_all_display_values_for_descriptor_group_and_type(request, typ_id):
#     """
#     Returns all the value of the related type of descriptor order and formatted as described.
#     """
#     dt = get_object_or_404(Descriptor, id=int(typ_id))
#
#     limit = 30
#
#     format_type = dt.format
#     list_type = format_type.get('list_type', '')
#
#     # safe limitation
#     if not list_type:
#         raise SuspiciousOperation(_("This type of descriptor does not contains a list"))
#     elif list_type == 'dropdown':
#         limit = 512
#     elif list_type == 'autocomplete':
#         raise SuspiciousOperation(_("List of values are not available for drop-down"))
#
#     sort_by = format_type.get('sortby_field', 'id')
#     values = []
#
#     c, n, values_list = dt.get_values(sort_by, False, None, limit)
#
#     if format_type['display_fields'] == 'value0':
#         for value in values_list:
#             values.append({
#                 'id': value['id'],
#                 'value': value['id'],
#                 'label': value['value0']
#             })
#     elif format_type['display_fields'] == 'value1':
#         for value in values_list:
#             values.append({
#                 'id': value['id'],
#                 'value': value['id'],
#                 'label': value['value1']
#             })
#     elif format_type['display_fields'] == 'value0-value1':
#         for value in values_list:
#             values.append({
#                 'id': value['id'],
#                 'value': value['id'],
#                 'label': "%s - %s" % (value['value0'], value['value1'])
#             })
#     elif format_type['display_fields'] == 'ordinal-value0':
#         for value in values_list:
#             values.append({
#                 'id': value['id'],
#                 'value': value['id'],
#                 'label': "%i - %s" % (value['ordinal'], value['value0'])
#             })
#     elif format_type['display_fields'] == 'hier0-value1':
#         for value in values_list:
#             shift_size = value['value0'].count('.')
#
#             values.append({
#                 'id': value['id'],
#                 'value': value['id'],
#                 'label': value['value1'],
#                 'offset': shift_size
#             })
#
#     return HttpResponseRest(request, values)
#
#
# @cache_page(60 * 60 * 24)
# @RestDescriptorTypeIdValueDisplay.def_auth_request(Method.GET, Format.JSON)
# def get_all_display_values_for_descriptor_type(request, typ_id):
#     """
#     Returns all the value of the related type of descriptor order and formatted as described.
#     """
#     dt = get_object_or_404(Descriptor, id=int(typ_id))
#
#     limit = 30
#
#     format_type = dt.format
#     list_type = format_type.get('list_type', '')
#
#     # safe limitation
#     if not list_type:
#         raise SuspiciousOperation(_("This type of descriptor does not contains a list"))
#     elif list_type == 'dropdown':
#         limit = 512
#     elif list_type == 'autocomplete':
#         raise SuspiciousOperation(_("List of values are not available for drop-down"))
#
#     sort_by = format_type.get('sortby_field', 'id')
#     values = []
#
#     c, n, values_list = dt.get_values(sort_by, False, None, limit)
#
#     if format_type['display_fields'] == 'value0':
#         for value in values_list:
#             values.append({
#                 'id': value['id'],
#                 'value': value['id'],
#                 'label': value['value0']
#             })
#     elif format_type['display_fields'] == 'value1':
#         for value in values_list:
#             values.append({
#                 'id': value['id'],
#                 'value': value['id'],
#                 'label': value['value1']
#             })
#     elif format_type['display_fields'] == 'value0-value1':
#         for value in values_list:
#             values.append({
#                 'id': value['id'],
#                 'value': value['id'],
#                 'label': "%s - %s" % (value['value0'], value['value1'])
#             })
#     elif format_type['display_fields'] == 'ordinal-value0':
#         for value in values_list:
#             values.append({
#                 'id': value['id'],
#                 'value': value['id'],
#                 'label': "%i - %s" % (value['ordinal'], value['value0'])
#             })
#     elif format_type['display_fields'] == 'hier0-value1':
#         for value in values_list:
#             shift_size = value['value0'].count('.')
#
#             values.append({
#                 'id': value['id'],
#                 'value': value['id'],
#                 'label': value['value1'],
#                 'offset': shift_size
#             })
#
#     return HttpResponseRest(request, values)
#
#
# @RestDescriptorDescriptorSearch.def_auth_request(Method.GET, Format.JSON, parameters=('value',))
# def search_descriptor(request, typ_id):
#     """
#     Search and returns a list of value from the related type of descriptor and formatted as described.
#     """
#     results_per_page = int_arg(request.GET.get('more', 30))
#     cursor = request.GET.get('cursor')
#     limit = results_per_page
#
#     dt = get_object_or_404(Descriptor, id=int(typ_id))
#
#     format_type = dt.format
#     list_type = format_type.get('list_type', '')
#
#     if not list_type:
#         raise SuspiciousOperation(_("This type of descriptor does not contains a list"))
#
#     search_field = format_type.get('search_field', 'value0')
#     value = request.GET['value']
#
#     values = []
#
#     prev_cursor, next_cursor, values_list = dt.search_values(value, search_field, cursor, limit)
#
#     if format_type['display_fields'] == 'value0':
#         for value in values_list:
#             values.append({
#                 'id': value['id'],
#                 'value': value['id'],
#                 'label': value['value0']
#             })
#     elif format_type['display_fields'] == 'value1':
#         for value in values_list:
#             values.append({
#                 'id': value['id'],
#                 'value': value['id'],
#                 'label': value['value1']
#             })
#     elif format_type['display_fields'] == 'value0-value1':
#         for value in values_list:
#             values.append({
#                 'id': value['id'],
#                 'value': value['id'],
#                 'label': "%s - %s" % (value['value0'], value['value1'])
#             })
#     elif format_type['display_fields'] == 'ordinal-value0':
#         for value in values_list:
#             values.append({
#                 'id': value['id'],
#                 'value': value['id'],
#                 'label': "%i - %s" % (value['ordinal'], value['value0'])
#             })
#     elif format_type['display_fields'] == 'hier0-value1':
#         for value in values_list:
#             shift_size = value['value0'].count('.')
#
#             values.append({
#                 'id': value['id'],
#                 'value': value['id'],
#                 'label': value['value1'],
#                 'offset': shift_size
#             })
#
#     results = {
#         'items': values,
#         'prev': prev_cursor,
#         'cursor': cursor,
#         'next': next_cursor
#     }
#
#     return HttpResponseRest(request, results)

# @RestDescriptorTypeIdValueDisplaySearch.def_auth_request(Method.GET, Format.JSON, parameters=('value',))
# def search_display_value_for_descriptor_group_and_type(request, typ_id):
#     """
#     Search and returns a list of value from the related type of descriptor and formatted as described.
#     """
#     results_per_page = int_arg(request.GET.get('more', 30))
#     cursor = request.GET.get('cursor')
#     limit = results_per_page
#
#     dt = get_object_or_404(Descriptor, id=int(typ_id))
#
#     format_type = dt.format
#     list_type = format_type.get('list_type', '')
#
#     if not list_type:
#         raise SuspiciousOperation(_("This type of descriptor does not contains a list"))
#
#     search_field = format_type.get('search_field', 'value0')
#     value = request.GET['value']
#
#     values = []
#
#     prev_cursor, next_cursor, values_list = dt.search_values(value, search_field, cursor, limit)
#
#     if format_type['display_fields'] == 'value0':
#         for value in values_list:
#             values.append({
#                 'id': value['id'],
#                 'value': value['id'],
#                 'label': value['value0']
#             })
#     elif format_type['display_fields'] == 'value1':
#         for value in values_list:
#             values.append({
#                 'id': value['id'],
#                 'value': value['id'],
#                 'label': value['value1']
#             })
#     elif format_type['display_fields'] == 'value0-value1':
#         for value in values_list:
#             values.append({
#                 'id': value['id'],
#                 'value': value['id'],
#                 'label': "%s - %s" % (value['value0'], value['value1'])
#             })
#     elif format_type['display_fields'] == 'ordinal-value0':
#         for value in values_list:
#             values.append({
#                 'id': value['id'],
#                 'value': value['id'],
#                 'label': "%i - %s" % (value['ordinal'], value['value0'])
#             })
#     elif format_type['display_fields'] == 'hier0-value1':
#         for value in values_list:
#             shift_size = value['value0'].count('.')
#
#             values.append({
#                 'id': value['id'],
#                 'value': value['id'],
#                 'label': value['value1'],
#                 'offset': shift_size
#             })
#
#     results = {
#         'items': values,
#         'prev': prev_cursor,
#         'cursor': cursor,
#         'next': next_cursor
#     }
#
#     return HttpResponseRest(request, results)


@RestDescriptorNameValuesList.def_auth_request(Method.GET, Format.JSON, parameters=('values',))
def get_some_display_values_for_descriptor_model_type(request, dmt_name):
    """
    Returns all the value of the related type of model of descriptor.
    """
    dmt = get_object_or_404(Descriptor, name=dmt_name)

    limit = 100
    format_type = dmt.format

    # json array
    values = json.loads(request.GET['values'])

    # no cursor, simple list, limited to 100 elements per call
    results = DescriptorFormatTypeManager.get_display_values_for(format_type, dmt, values, limit)

    return HttpResponseRest(request, results)
