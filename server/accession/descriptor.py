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


class RestDescriptorGroupIdTypeIdValueId(RestDescriptorGroupIdTypeIdValue):
    regex = r'^(?P<vid>[a-zA-Z0-9:_]+)/$'
    suffix = 'id'


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
            'num_descriptor_types': group.types_set.all().count(),
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
    perms={'accession.add_descriptorgroup': _('You are not allowed to create a group of descriptors')},
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
        'num_descriptor_types': 0,
        'can_delete': group.can_delete,
        'can_modify': group.can_modify
    }

    return HttpResponseRest(request, response)


@RestDescriptorGroupId.def_auth_request(
    Method.DELETE, Format.JSON,
    perms={
        'accession.delete_descriptorgroup': _("You are not allowed to delete a group of descriptors"),
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


@RestDescriptorGroupId.def_auth_request(
    Method.PATCH, Format.JSON, content={
        "type": "object",
        "properties": {
            "name": {"type": "string", 'minLength': 3, 'maxLength': 32}
        },
    },
    perms={
        'accession.change_descriptorgroup': _("You are not allowed to modify a group of descriptors"),
    },
    staff=True
)
def patch_descriptor_group(request, id):
    group_id = int(id)
    group = get_object_or_404(DescriptorGroup, id=group_id)
    group_name = request.data['name']

    if group_name == group.name:
        return HttpResponseRest(request, {})

    if DescriptorGroup.objects.filter(name__exact=group_name).exists():
        raise SuspiciousOperation(_("Name of group of descriptor already in usage"))

    if not group.can_modify:
        raise SuspiciousOperation(_("It is not permit to modify this group of descriptors"))

    group.name = group_name

    group.full_clean()
    group.save()

    result = {
        'id': group.id,
        'name': group.name
    }

    return HttpResponseRest(request, result)


@RestDescriptorGroupSearch.def_auth_request(Method.GET, Format.JSON, ('filters',), staff=True)
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
                'num_descriptor_types': group.types_set.all().count(),
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
        'num_descriptor_types': group.types_set.all().count()
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
            'num_descriptor_values': count,
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


@RestDescriptorGroupIdTypeSearch.def_auth_request(Method.GET, Format.JSON, ('filters',), staff=True)
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
                'num_descriptor_values': count,
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
        'num_descriptor_values': count,
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
    perms={
        'accession.change_descriptorgroup': _('You are not allowed to modify a group of types of descriptors'),
        'accession.add_descriptortype': _('You are not allowed to create a type of descriptor')
    },
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
        'description': descr_type.description,
        'group': group.id,
        'num_descriptor_values': 0,
        'can_delete': descr_type.can_delete,
        'can_modify': descr_type.can_modify
    }

    return HttpResponseRest(request, response)


@RestDescriptorGroupIdTypeId.def_auth_request(
    Method.DELETE, Format.JSON,
    perms={
        'accession.change_descriptorgroup': _('You are not allowed to modify a group of types of descriptors'),
        'accession.delete_descriptortype': _("You are not allowed to delete a type of descriptor"),
    },
    staff=True
)
def delete_descriptor_type_for_group(request, id, tid):
    group_id = int_arg(id)
    group = get_object_or_404(DescriptorGroup, id=group_id)

    descr_type_id = int_arg(tid)
    descr_type = get_object_or_404(DescriptorType, id=descr_type_id, group=group)

    if descr_type.has_values():
        raise SuspiciousOperation(_("Only an empty of values type of descriptor can be deleted"))

    if descr_type.is_used():
        raise SuspiciousOperation(_("Only unused types of descriptor can be deleted"))

    descr_type.delete()

    return HttpResponseRest(request, {})


@RestDescriptorGroupIdTypeId.def_auth_request(
    Method.PUT, Format.JSON, content={
        "type": "object",
        "properties": {
            "name": {"type": "string", 'minLength': 3, 'maxLength': 32},
            "code": {"type": "string", 'minLength': 3, 'maxLength': 32},
            "description": {"type": "string", 'maxLength': 1024, 'blank': True},
            "format": {
                "type": "object",
                "properties": {
                }
            }
        },
    },
    perms={
        'accession.change_descriptorgroup': _('You are not allowed to modify a group of types of descriptors'),
        'accession.change_descriptortype': _('You are not allowed to modify a type of descriptor')
    },
    staff=True
)
def update_descriptor_type(request, id, tid):
    descr_type_params = request.data
    format = descr_type_params['format']
    description = request.data['description']

    group_id = int_arg(id)
    group = get_object_or_404(DescriptorGroup, id=group_id)

    type_id = int_arg(tid)

    descr_type = get_object_or_404(DescriptorType, id=type_id, group=group)
    org_format = json.loads(descr_type.format)

    if not descr_type.can_modify:
        raise SuspiciousOperation(_("It is not permit to modify this type of descriptor"))

    # had values -> has no values
    if not format['type'].startswith('enum_') and org_format['type'].startswith('enum_'):
        # overwrite values
        descr_type.values = ""
        descr_type.values_set.clear()

    # single enumeration
    if format['type'] == 'enum_single':
        format['fields'] = ['value', '']

        # reset values because it changes of type
        if org_format['type'] != 'enum_single':
            descr_type.values = ""
            descr_type.values_set.all().delete()

    # pair enumeration
    elif format['type'] == 'enum_pair':
        if len(format['fields']) != 2:
            raise SuspiciousOperation(_("Type of descriptor with enumeration of pairs require two fields"))

            # reset values because it changes of type
        if org_format['type'] != 'enum_pair':
            descr_type.values = ""
            descr_type.values_set.all().delete()

    # ordinal enumeration
    elif format['type'] == 'enum_ordinal':
        # always translation with enum or ordinal
        format['trans'] = True

        # range as integer in this case
        org_min_range, org_max_range = [int(x) for x in org_format.get('range', ['0', '0'])]
        min_range, max_range = [int(x) for x in format['range']]

        # range validation
        if min_range < -127 or max_range > 127:
            raise SuspiciousOperation(_('Range limits are [-127, 127]'))

        # reset values because it changes of type
        if org_format['type'] != 'enum_ordinal':
            descr_type.values = ""
            descr_type.values_set.all().delete()

        # regenerate values only if difference in range
        if org_min_range != min_range or org_max_range != max_range:
            # this will regenerate new entries for ordinal
            format['fields'] = ['label', '']
            format['trans'] = True

            values = {}

            for lang in Languages.choices():
                lvalues = {}

                for ordinal in range(min_range, max_range+1):
                    code = "%s:%07i" % (descr_type.code, ordinal)
                    lvalues[code] = {'ordinal': ordinal, 'value0': 'Undefined(%i)' % ordinal}

                values[lang[0]] = lvalues

            descr_type.values = json.dumps(values)

    descr_type.name = descr_type_params['name']
    descr_type.format = json.dumps(format)
    descr_type.description = description

    count = descr_type.count_num_values()

    descr_type.save()

    response = {
        'id': descr_type.id,
        'name': descr_type.name,
        'code': descr_type.code,
        'description': descr_type.description,
        'format': json.loads(descr_type.format),
        'group': group.id,
        'num_descriptor_values': count,
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


@RestDescriptorGroupIdTypeIdValue.def_auth_request(
    Method.POST, Format.JSON, content={
        "type": "object",
        "properties": {
            "parent": {'type': ['string', 'null'], 'minLength': 6, 'maxLength': 32, "required": False},
            "ordinal": {'type': ['number', 'null'], "required": False},
            "value0": {'type': 'string', 'minLength': 1, 'maxLength': 32},
            "value1": {'type': ['string', 'null'], 'minLength': 1, 'maxLength': 32, "required": False}
        },
    },
    perms={
        'accession.change_descriptortype': _('You are not allowed to modify a type of descriptor'),
        'accession.create_descriptorvalue': _('You are not allowed to create a value of descriptor')
    },
    staff=True
)
def create_descriptor_values_for_type(request, id, tid):
    """
    Create and insert at last a new value for a type of descriptor.

    :param id: Descriptor group id
    :param tid: Descriptor type id
    """
    group_id = int(id)
    type_id = int(tid)

    group = get_object_or_404(DescriptorGroup, id=group_id)
    descr_type = get_object_or_404(DescriptorType, id=type_id, group=group)

    qs = descr_type.values_set.all().order_by('-code')[:1]
    if qs.exists():
        suffix = int(qs[0].code.split(':')[1]) + 1
    else:
        suffix = 1

    code = '%s:%07i' % (descr_type.code, suffix)

    format = json.loads(descr_type.format)

    if format.get('trans', False):
        for lang in Languages.choices():
            dv = DescriptorValue()

            dv.descriptor = descr_type

            dv.language = lang[0]
            dv.name = '%s:%s' % (code, lang[0])
            dv.code = code
            dv.parent = request.data.get('parent')
            dv.ordinal = request.data.get('ordinal')
            dv.value0 = request.data.get('value0')
            dv.value1 = request.data.get('value1')

            dv.save()
    else:
        dv = DescriptorValue()

        dv.descriptor = descr_type

        dv.name = '%s:%s' % (code, 'en')
        dv.code = code
        dv.parent = request.data.get('parent')
        dv.ordinal = request.data.get('ordinal')
        dv.value0 = request.data.get('value0')
        dv.value1 = request.data.get('value1')

        dv.save()

    result = {
        'id': code,
        'parent': request.data.get('parent'),
        'ordinal': request.data.get('ordinal'),
        'value0': request.data.get('value0'),
        'value1': request.data.get('value1')
    }

    return HttpResponseRest(request, result)


@RestDescriptorGroupIdTypeIdValueId.def_auth_request(
    Method.PATCH, Format.JSON,
    content={
        "type": "object",
        "properties": {
            "value0": {"type": "string", 'minLength': 3, 'maxLength': 32, 'required': False},
            "value1": {"type": "string", 'minLength': 3, 'maxLength': 32, 'required': False},
            "ordinal": {"type": "number", 'required': False},
        },
    },
    perms={
        'accession.change_descriptortype': _('You are not allowed to modify a type of descriptor'),
        'accession.change_descriptorvalue': _('You are not allowed to modify a value of type of descriptor'),
    },
    staff=True
)
def patch_value_for_descriptor_model(request, id, tid, vid):
    """
    Patch the value for a specific model of descriptor.
    The field can be 'ordinal', 'value0' or 'value1'.
    """
    group_id = int(id)
    type_id = int(tid)

    group = get_object_or_404(DescriptorGroup, id=group_id)
    descr_type = get_object_or_404(DescriptorType, id=type_id, group=group)

    format = json.loads(descr_type.format)

    if not format['type'].startswith("enum_"):
        raise SuspiciousOperation(_("There is no values for this type of descriptor"))

    ordinal = request.data.get('ordinal')
    value0 = request.data.get('value0')
    value1 = request.data.get('value1')

    if ordinal is not None and format['type'] != 'enum_ordinal':
        raise SuspiciousOperation(_("Ordinal field is only defined for enumeration with ordinal"))

    if value1 is not None and format['type'] != 'enum_pair':
        raise SuspiciousOperation(_("Second value field is only defined for enumeration of pairs"))

    # data stored in type of descriptor
    if descr_type.values != "":
        values = json.loads(descr_type.values)

        if format.get('trans', False):
            lang = translation.get_language()
            lvalues = values[lang]
        else:
            lvalues = values

        if ordinal is not None:
            lvalues[vid]['ordinal'] = ordinal
        if value0 is not None:
            lvalues[vid]['value0'] = value0
        if value1 is not None:
            lvalues[vid]['value&'] = value1

        descr_type.values = json.dumps(values)
        descr_type.save()
    else:
        # data stored in table of values
        if format.get('trans', False):
            lang = translation.get_language()
            descr_value = descr_type.values_set.get(code=vid, language=lang)
        else:
            descr_value = descr_type.values_set.get(code=vid)

        if ordinal is not None:
            descr_value.ordinal = ordinal
        elif value0 is not None:
            descr_value.value0 = value0
        elif value1 is not None:
            descr_value.value1 = value1

        descr_value.save()

    result = {
        'code': vid,
    }

    if ordinal is not None:
        result['ordinal'] = ordinal
    elif value0 is not None:
        result['value0'] = value0
    elif value1 is not None:
        result['value1'] = value1

    return HttpResponseRest(request, result)


@RestDescriptorGroupIdTypeIdValueId.def_auth_request(
    Method.DELETE, Format.JSON,
    perms={
        'accession.change_descriptortype': _('You are not allowed to modify a type of descriptor'),
        'accession.delete_descriptorvalue': _('You are not allowed to remove a value of type of descriptor'),
    },
    staff=True
)
def delete_value_for_descriptor_type(request, id, tid, vid):
    """
    Delete a single value for a type of descriptor.
    """
    group_id = int(id)
    type_id = int(tid)

    group = get_object_or_404(DescriptorGroup, id=group_id)
    descr_type = get_object_or_404(DescriptorType, id=type_id, group=group)

    format = json.loads(descr_type.format)

    # internally stored values
    if descr_type.values != "":
        values = json.loads(descr_type.values)

        if format['trans']:
            for lvalues in values:
                del lvalues[vid]
        else:
            del values[vid]

        descr_type.values = json.loads(values)
    else:
        # table stored values
        values = descr_type.values_set.filter(code=vid)
        values.delete()

    return HttpResponseRest(request, {})
