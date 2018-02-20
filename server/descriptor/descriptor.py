# -*- coding: utf-8; -*-
#
# @file descriptor.py
# @brief coll-gate descriptor module, descriptor
# @author Frédéric SCHERMA (INRA UMR1095)
# @author Medhi BOULNEMOUR (INRA UMR1095)
# @date 2016-09-01
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

import json

from django.contrib.contenttypes.models import ContentType
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

from igdectk.common.cache import invalidate_cache
from main.cursor import CursorQuery
from main.models import InterfaceLanguages, Entity
from .models import Descriptor, DescriptorValue, DescriptorIndex, JSONBFieldIndexType


class RestDescriptor(RestHandler):
    regex = r'^descriptor/$'
    name = 'descriptor'


class RestDescriptorDescriptor(RestDescriptor):
    regex = r'^descriptor/$'
    suffix = 'descriptor'


class RestDescriptorDescriptorGroup(RestDescriptorDescriptor):
    regex = r'^group/$'
    suffix = 'group'


class RestDescriptorDescriptorIndex(RestDescriptor):
    regex = r'^index/$'
    suffix = 'index'


class RestDescriptorDescriptorIndexId(RestDescriptorDescriptorIndex):
    regex = r'^(?P<index_id>[0-9]+)/$'
    suffix = 'id'


class RestDescriptorDescriptorIndexCount(RestDescriptorDescriptorIndex):
    regex = r'^count/$'
    suffix = 'count'


class RestDescriptorDescriptorCount(RestDescriptorDescriptor):
    regex = r'^count/$'
    suffix = 'count'


class RestDescriptorDescriptorId(RestDescriptorDescriptor):
    regex = r'^(?P<des_id>[0-9]+)/$'
    suffix = 'id'


class RestDescriptorDescriptorSearch(RestDescriptorDescriptor):
    regex = r'^search/$'
    suffix = 'search'


class RestDescriptorDescriptorIdValue(RestDescriptorDescriptorId):
    regex = r'^value/$'
    suffix = 'value'


class RestDescriptorDescriptorIdLabel(RestDescriptorDescriptorId):
    regex = r'^label/$'
    suffix = 'label'


class RestDescriptorDescriptorIdValueDisplay(RestDescriptorDescriptorIdValue):
    regex = r'^display/$'
    suffix = 'display'


class RestDescriptorDescriptorIdValueId(RestDescriptorDescriptorIdValue):
    regex = r'^(?P<val_id>[a-zA-Z0-9:_\.]+)/$'
    suffix = 'id'


class RestDescriptorNameOrCodeValuesList(RestDescriptor):
    regex = r'^descriptor-values-list/(?P<descriptor_name_or_code>[a-zA-Z0-9\-\_\.]+)/$'
    suffix = 'descriptor'


class RestDescriptorDescriptorIdValueDisplaySearch(RestDescriptorDescriptorIdValueDisplay):
    regex = r'^search/$'
    suffix = 'search'


class RestDescriptorDescriptorIdValueIdField(RestDescriptorDescriptorIdValueId):
    regex = r'^(?P<field>value0|value1)/$'
    suffix = 'field'


class RestDescriptorDescriptorIdValueIdDisplay(RestDescriptorDescriptorIdValueId):
    regex = r'^display/$'
    suffix = 'display'


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
            'format': descriptor.format
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


@RestDescriptorDescriptorIndex.def_auth_request(Method.GET, Format.JSON)
def get_index_list(request):
    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = json.loads(request.GET.get('cursor', 'null'))
    limit = results_per_page
    sort_by = json.loads(request.GET.get('sort_by', '[]'))

    if not len(sort_by) or sort_by[-1] not in ('id', '+id', '-id'):
        order_by = sort_by + ['id']
    else:
        order_by = sort_by

    cq = CursorQuery(DescriptorIndex)

    if request.GET.get('filters'):
        cq.filter(json.loads(request.GET['filters']))

    if request.GET.get('search'):
        cq.filter(json.loads(request.GET['search']))

    cq.cursor(cursor, order_by)
    cq.order_by(order_by).limit(limit)

    items = []

    for index in cq:
        d = {
            'id': index.id,
            'descriptor': index.descriptor.name,
            'target': index.target.name.capitalize(),
            'type': JSONBFieldIndexType(index.type).name
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


@RestDescriptorDescriptorIndexCount.def_auth_request(Method.GET, Format.JSON)
def get_descriptor_list_count(request):
    """
    Get the count of number of descriptor indexes.
    """

    cq = CursorQuery(DescriptorIndex)

    if request.GET.get('filters'):
        cq.filter(json.loads(request.GET['filters']))

    if request.GET.get('search'):
        cq.filter(json.loads(request.GET['search']))

    results = {
        'perms': [],
        'count': cq.count()
    }

    return HttpResponseRest(request, results)


@RestDescriptorDescriptorIndexId.def_auth_request(Method.GET, Format.JSON)
def get_index(request, index_id):
    index = get_object_or_404(DescriptorIndex, id=int(index_id))

    response = {
        'id': index.id,
        'descriptor': index.descriptor,
        'target': index.target,
        'type': index.type,
    }

    return HttpResponseRest(request, response)


@RestDescriptorDescriptorIndex.def_auth_request(
    Method.POST, Format.JSON, content={
        "type": "object",
        "properties": {
            "descriptor": {"type": "integer"},
            "target": Entity.CONTENT_TYPE_VALIDATOR,
            "type": {"type": "integer", "minimum": 0, "maximum": 4, "required": False}
        },
    },
    perms={
        'descriptor.add_descriptorindex': _('You are not allowed to create a descriptor index')
    },
    staff=True
)
def get_index(request):
    descriptor_id = int(request.data.get('descriptor'))
    target = request.data.get('target')
    index_type = JSONBFieldIndexType(request.data.get('type', 0))

    descriptor = Descriptor.objects.get(id=descriptor_id)

    app_label, model = target.split('.')
    target = ContentType.objects.get_by_natural_key(app_label, model)

    index = DescriptorIndex.objects.create(
        descriptor=descriptor,
        target=target,
        type=index_type.value
    )

    index.save()
    index.create_or_drop_index(index.target)

    response = {
        'id': index.id,
        'descriptor': index.descriptor.name,
        'target': index.target.model,
        'type': index.type,
    }

    return HttpResponseRest(request, response)


@RestDescriptorDescriptorIndexId.def_auth_request(Method.DELETE, Format.JSON)
def delete_index(request, index_id):
    index = get_object_or_404(DescriptorIndex, id=int(index_id))

    if index.count_index_usage() == 0:
        index.delete()
    else:
        from django.core import exceptions
        raise exceptions.SuspiciousOperation(_("This index refer to a descriptor used in a layout"))

    return HttpResponseRest(request, {})


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
def get_descriptor(request, des_id):
    descriptor = get_object_or_404(Descriptor, id=int(des_id))

    count = descriptor.count_num_values()

    response = {
        'id': descriptor.id,
        'name': descriptor.name,
        'code': descriptor.code,
        'label': descriptor.get_label(),
        'description': descriptor.description,
        'group_name': descriptor.group_name,
        'num_descriptor_values': count,
        'format': descriptor.format,
        'can_delete': descriptor.can_delete,
        'can_modify': descriptor.can_modify,
    }

    return HttpResponseRest(request, response)


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
                'format': descriptor.format
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
def delete_descriptor(request, des_id):
    descriptor = get_object_or_404(Descriptor, id=int(des_id))

    # todo: Check if the descriptor has values and it's used
    # if descriptor.has_values():
    #     raise SuspiciousOperation(_("Only an empty values of descriptor can be deleted"))
    #
    # if descriptor.in_usage():
    #     raise SuspiciousOperation(_("Only unused types of descriptor can be deleted"))

    descriptor.delete()

    # INDEXATION TEST --
    # from accession.models import Accession
    # descriptor.index = 1
    # descriptor.save()
    # descriptor.create_or_drop_index(Accession)
    # result = Accession.
    # sql = """select * from pg_indexes where tablename not like 'pg%';"""
    #
    # from django.db import connections
    # connection = connections['default']
    # with connection.cursor() as cursor:
    #     cursor.execute(sql)
    #     result = cursor.fetchall()

    # from django.db import models

    return HttpResponseRest(request, {})


@RestDescriptorDescriptor.def_auth_request(
    Method.POST, Format.JSON, content={
        "type": "object",
        "properties": {
            "name": Descriptor.NAME_VALIDATOR,
            "label": Descriptor.LABEL_VALIDATOR,
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

    # format validation
    DescriptorFormatTypeManager.check(descriptor_params['format'])

    lang = translation.get_language()

    descriptor = Descriptor.objects.create(
        name=descriptor_params['name'],
        code=code,
        label={lang: descriptor_params['label']},
        group_name=descriptor_params['group_name'],
        format=descriptor_params['format'],
        can_delete=True,
        can_modify=True
    )

    response = {
        'id': descriptor.id,
        'name': descriptor.name,
        'label': descriptor.get_label(),
        'code': descriptor.code,
        'description': descriptor.description,
        'format': descriptor.format,
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
def update_descriptor(request, des_id):
    descriptor_params = request.data
    format_type = descriptor_params['format']
    description = request.data['description']

    descriptor = get_object_or_404(Descriptor, id=int(des_id))
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
def get_descriptor_values(request, des_id):
    """
    Get the list of values for a given descriptor and according to the current language.
    """
    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = request.GET.get('cursor')
    limit = results_per_page

    sort_by = request.GET.get('sort_by', 'id')

    descriptor = get_object_or_404(Descriptor, id=int(des_id))

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


@RestDescriptorDescriptorIdValue.def_auth_request(
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
        'descriptor.change_descriptor': _('You are not allowed to modify a descriptor'),
        'descriptor.create_descriptorvalue': _('You are not allowed to create a value of descriptor')
    },
    staff=True
)
def create_descriptor_values(request, des_id):
    """
    Create and insert at last a new value for a descriptor.
    """
    descriptor = get_object_or_404(Descriptor, id=int(des_id))

    qs = descriptor.values_set.all().order_by('-code')[:1]
    if qs.exists():
        suffix = int(qs[0].code.split(':')[1]) + 1
    else:
        suffix = 1

    code = '%s:%07i' % (descriptor.code, suffix)

    format_type = descriptor.format

    if format_type.get('trans', False):
        for lang in InterfaceLanguages.choices():
            dv = DescriptorValue()

            dv.descriptor = descriptor

            dv.language = lang[0]
            dv.code = code
            dv.parent = request.data.get('parent')
            dv.ordinal = request.data.get('ordinal')
            dv.value0 = request.data.get('value0')
            dv.value1 = request.data.get('value1')

            dv.save()
    else:
        dv = DescriptorValue()

        dv.descriptor = descriptor

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


@RestDescriptorDescriptorIdValueId.def_auth_request(
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
        'descriptor.change_descriptor': _('You are not allowed to modify a descriptor'),
        'descriptor.change_descriptorvalue': _('You are not allowed to modify a value of a descriptor'),
    },
    staff=True
)
def patch_value_for_descriptor(request, des_id, val_id):
    """
    Patch the value for a descriptor.
    The field can be 'ordinal', 'value0' or 'value1'.
    """
    descriptor = get_object_or_404(Descriptor, id=int(des_id))

    format_type = descriptor.format

    if not format_type['type'].startswith("enum_"):
        raise SuspiciousOperation(_("There is no values for this descriptor"))

    ordinal = request.data.get('ordinal')
    value0 = request.data.get('value0')
    value1 = request.data.get('value1')

    if ordinal is not None and format_type['type'] != 'enum_ordinal':
        raise SuspiciousOperation(_("Ordinal field is only defined for enumeration with ordinal"))

    if value1 is not None and format_type['type'] != 'enum_pair':
        raise SuspiciousOperation(_("Second value field is only defined for enumeration of pairs"))

    # data stored in descriptor
    if descriptor.values is not None:
        values = descriptor.values

        if format_type.get('trans', False):
            lang = translation.get_language()
            lvalues = values[lang]
        else:
            lvalues = values

        if ordinal is not None:
            lvalues[val_id]['ordinal'] = ordinal
        if value0 is not None:
            lvalues[val_id]['value0'] = value0
        if value1 is not None:
            lvalues[val_id]['value1'] = value1

        descriptor.values = values
        descriptor.save()
    else:
        # data stored in table of values
        if format_type.get('trans', False):
            lang = translation.get_language()
            descr_value = descriptor.values_set.get(code=val_id, language=lang)
        else:
            descr_value = descriptor.values_set.get(code=val_id)

        if ordinal is not None:
            descr_value.ordinal = ordinal
        elif value0 is not None:
            descr_value.value0 = value0
        elif value1 is not None:
            descr_value.value1 = value1

        descr_value.save()

    result = {
        'code': val_id
    }

    if ordinal is not None:
        result['ordinal'] = ordinal
    elif value0 is not None:
        result['value0'] = value0
    elif value1 is not None:
        result['value1'] = value1

    return HttpResponseRest(request, result)


@RestDescriptorDescriptorIdValueId.def_auth_request(
    Method.DELETE, Format.JSON,
    perms={
        'descriptor.change_descriptor': _('You are not allowed to modify a descriptor'),
        'descriptor.delete_descriptorvalue': _('You are not allowed to remove a value of descriptor'),
    },
    staff=True
)
def delete_value_for_descriptor(request, des_id, val_id):
    """
    Delete a single value for a descriptor.
    """
    descriptor = get_object_or_404(Descriptor, id=int(des_id))

    if descriptor.in_usage():
        raise SuspiciousOperation(_("There is some data using the descriptor"))

    format_type = descriptor.format

    # internally stored values
    if descriptor.values is not None:
        values = descriptor.values

        if format_type['trans']:
            for lvalues in values:
                del lvalues[val_id]
        else:
            del values[val_id]

        descriptor.values = values
    else:
        # table stored values
        values = descriptor.values_set.filter(code=val_id)
        values.delete()

    return HttpResponseRest(request, {})


@RestDescriptorDescriptorIdValueId.def_auth_request(Method.GET, Format.JSON)
def get_value_for_descriptor(request, des_id, val_id):
    """
    Get a single value for a descriptor.
    """
    descriptor = get_object_or_404(Descriptor, id=int(des_id))
    value = descriptor.get_value(val_id)

    result = {
        'parent': value[0],
        'ordinal': value[1],
        'value0': value[2],
        'value1': value[3]
    }

    return HttpResponseRest(request, result)


@RestDescriptorDescriptorIdValueIdDisplay.def_auth_request(Method.GET, Format.JSON)
def get_display_value_for_descriptor(request, des_id, val_id):
    """
    Get a single value for a descriptor.
    """
    descriptor = get_object_or_404(Descriptor, id=int(des_id))

    format_type = descriptor.format
    list_type = format_type.get('list_type', '')

    if not list_type:
        raise SuspiciousOperation(_("This descriptor does not contains a list"))

    value = descriptor.get_value(val_id)

    if format_type['display_fields'] == 'value0':
        result = {
            'id': val_id,
            'value': val_id,
            'label': value[2]
        }
    elif format_type['display_fields'] == 'value1':
        result = {
            'id': val_id,
            'value': val_id,
            'label': value[3]
        }
    elif format_type['display_fields'] == 'value0-value1':
        result = {
            'id': val_id,
            'value': val_id,
            'label': "%s - %s" % (value[2], value[3])
        }
    elif format_type['display_fields'] == 'ordinal-value0':
        result = {
            'id': val_id,
            'value': val_id,
            'label': "%i - %s" % (value[1], value[2])
        }
    elif format_type['display_fields'] == 'hier0-value1':
        shift_size = value[2].count('.')

        result = {
            'id': val_id,
            'value': val_id,
            'label': value[3],
            'offset': shift_size
        }
    else:
        result = {}

    return HttpResponseRest(request, result)


@RestDescriptorDescriptorIdValueIdField.def_auth_request(
    Method.GET, Format.JSON)
def get_labels_for_descriptor_and_field(request, des_id, val_id, field):
    """
    Get all translations for a specific field of a value of descriptor.
    """
    if field not in ('value0', 'value1'):
        raise SuspiciousOperation(_('Field name must be value0 or value1'))

    descriptor = get_object_or_404(Descriptor, id=int(des_id))
    format_type = descriptor.format

    results = {}

    # internally stored values
    if descriptor.values is not None:
        values = descriptor.values

        if format_type['trans']:
            for lang, lvalues in values.items():
                if lvalues.get(val_id):
                    results[lang] = lvalues[val_id].get(field)
        else:
            results['en'] = values[val_id][field]
    else:
        # data stored in table of values
        descr_values = descriptor.values_set.filter(code=val_id)

        for v in descr_values:
            if field == 'value0':
                results[v.language] = v.value0
            elif field == 'value1':
                results[v.language] = v.value1

    # complete with missing languages
    for lang, lang_label in InterfaceLanguages.choices():
        if lang not in results:
            results[lang] = ""

    return HttpResponseRest(request, results)


@RestDescriptorDescriptorIdValueIdField.def_auth_request(
    Method.PUT, Format.JSON, content={},
    perms={
        'descriptor.change_descriptor': _('You are not allowed to modify a descriptor'),
        'descriptor.change_descriptorvalue': _('You are not allowed to modify a value of descriptor'),
    }, staff=True)
def set_values_for_descriptor(request, des_id, val_id, field):
    """
    Set many translations for a specific field of a value of descriptor.
    """
    if field not in ('value0', 'value1'):
        raise SuspiciousOperation(_('Field name must be value0 or value1'))

    descriptor = get_object_or_404(Descriptor, id=int(des_id))
    new_values = request.data

    languages_values = [lang[0] for lang in InterfaceLanguages.choices()]

    for lang, label in new_values.items():
        if lang not in languages_values:
            raise SuspiciousOperation(_("Unsupported language identifier"))

    format_type = descriptor.format

    # internally stored values
    if descriptor.values is not None:
        values = descriptor.values

        if format_type['trans']:
            for lang, lvalues in values.items():
                if lvalues.get(val_id):
                    lvalues[val_id][field] = new_values[lang]
        else:
            values[val_id] = new_values['en']

        descriptor.values = values

        descriptor.update_field('values')
        descriptor.save()
    else:
        # data stored in table of values
        descr_values = descriptor.values_set.filter(code=val_id)

        for v in descr_values:
            if field == 'value0':
                descriptor.update_field('value0')
                v.value0 = new_values[v.language]
            elif field == 'value1':
                descriptor.update_field('value1')
                v.value1 = new_values[v.language]

            v.save()

    lang = translation.get_language()

    results = {
        'value': new_values[lang]
    }

    return HttpResponseRest(request, results)


@cache_page(60 * 60 * 24)
@RestDescriptorDescriptorIdValueDisplay.def_auth_request(Method.GET, Format.JSON)
def get_all_display_values_for_descriptor(request, des_id):
    """
    Returns all the value of the related descriptor order and formatted as described.
    """
    dt = get_object_or_404(Descriptor, id=int(des_id))

    limit = 30

    format_type = dt.format
    list_type = format_type.get('list_type', '')

    # safe limitation
    if not list_type:
        raise SuspiciousOperation(_("This descriptor does not contains a list"))
    elif list_type == 'dropdown':
        limit = 512
    elif list_type == 'autocomplete':
        raise SuspiciousOperation(_("List of values are not available for drop-down"))

    sort_by = format_type.get('sortby_field', 'id')
    values = []

    c, n, values_list = dt.get_values(sort_by, False, None, limit)

    if format_type['display_fields'] == 'value0':
        for value in values_list:
            values.append({
                'id': value['id'],
                'value': value['id'],
                'label': value['value0']
            })
    elif format_type['display_fields'] == 'value1':
        for value in values_list:
            values.append({
                'id': value['id'],
                'value': value['id'],
                'label': value['value1']
            })
    elif format_type['display_fields'] == 'value0-value1':
        for value in values_list:
            values.append({
                'id': value['id'],
                'value': value['id'],
                'label': "%s - %s" % (value['value0'], value['value1'])
            })
    elif format_type['display_fields'] == 'ordinal-value0':
        for value in values_list:
            values.append({
                'id': value['id'],
                'value': value['id'],
                'label': "%i - %s" % (value['ordinal'], value['value0'])
            })
    elif format_type['display_fields'] == 'hier0-value1':
        for value in values_list:
            shift_size = value['value0'].count('.')

            values.append({
                'id': value['id'],
                'value': value['id'],
                'label': value['value1'],
                'offset': shift_size
            })

    return HttpResponseRest(request, values)


@RestDescriptorDescriptorIdValueDisplaySearch.def_auth_request(Method.GET, Format.JSON, parameters=('value',))
def search_display_value_for_descriptor(request, des_id):
    """
    Search and returns a list of value from the related descriptor and formatted as described.
    """
    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = request.GET.get('cursor')
    limit = results_per_page

    descriptor = get_object_or_404(Descriptor, id=int(des_id))

    format_type = descriptor.format
    list_type = format_type.get('list_type', '')

    if not list_type:
        raise SuspiciousOperation(_("This descriptor does not contains a list"))

    search_field = format_type.get('search_field', 'value0')
    value = request.GET['value']

    values = []

    prev_cursor, next_cursor, values_list = descriptor.search_values(value, search_field, cursor, limit)

    if format_type['display_fields'] == 'value0':
        for value in values_list:
            values.append({
                'id': value['id'],
                'value': value['id'],
                'label': value['value0']
            })
    elif format_type['display_fields'] == 'value1':
        for value in values_list:
            values.append({
                'id': value['id'],
                'value': value['id'],
                'label': value['value1']
            })
    elif format_type['display_fields'] == 'value0-value1':
        for value in values_list:
            values.append({
                'id': value['id'],
                'value': value['id'],
                'label': "%s - %s" % (value['value0'], value['value1'])
            })
    elif format_type['display_fields'] == 'ordinal-value0':
        for value in values_list:
            values.append({
                'id': value['id'],
                'value': value['id'],
                'label': "%i - %s" % (value['ordinal'], value['value0'])
            })
    elif format_type['display_fields'] == 'hier0-value1':
        for value in values_list:
            shift_size = value['value0'].count('.')

            values.append({
                'id': value['id'],
                'value': value['id'],
                'label': value['value1'],
                'offset': shift_size
            })

    results = {
        'items': values,
        'prev': prev_cursor,
        'cursor': cursor,
        'next': next_cursor
    }

    return HttpResponseRest(request, results)


@RestDescriptorNameOrCodeValuesList.def_auth_request(Method.GET, Format.JSON, parameters=('values',))
def get_some_display_values_for_descriptor(request, descriptor_name_or_code):
    """
    Returns all the value of the related of descriptor from descriptor name or code.
    """

    if Descriptor.objects.filter(code=descriptor_name_or_code):
        descriptor = Descriptor.objects.get(code=descriptor_name_or_code)
    else:
        descriptor = get_object_or_404(Descriptor, name=descriptor_name_or_code)

    limit = 100
    format_type = descriptor.format

    # json array
    values = json.loads(request.GET['values'])

    # no cursor, simple list, limited to 100 elements per call
    results = DescriptorFormatTypeManager.get_display_values_for(format_type, descriptor, values, limit)

    return HttpResponseRest(request, results)


@RestDescriptorDescriptorIdLabel.def_auth_request(Method.GET, Format.JSON)
def get_all_labels_of_descriptor(request, des_id):
    """
    Returns labels for each language related to the user interface.
    """
    descriptor = get_object_or_404(Descriptor, id=int(des_id))

    label_dict = descriptor.label

    # complete with missing languages
    for lang, lang_label in InterfaceLanguages.choices():
        if lang not in label_dict:
            label_dict[lang] = ""

    results = label_dict

    return HttpResponseRest(request, results)


@RestDescriptorDescriptorIdLabel.def_admin_request(Method.PUT, Format.JSON, content={
    "type": "object",
    "additionalProperties": Descriptor.LABEL_VALIDATOR
}, perms={
    'main.change_descriptor': _("You are not allowed to modify descriptor"),
}, staff=True)
def change_language_labels(request, des_id):
    descriptor = get_object_or_404(Descriptor, id=int(des_id))

    labels = request.data
    languages_values = [lang[0] for lang in InterfaceLanguages.choices()]

    for lang, label in labels.items():
        if lang not in languages_values:
            raise SuspiciousOperation(_("Unsupported language identifier"))

        descriptor.label = labels
    descriptor.save()

    result = {
        'label': descriptor.get_label()
    }

    invalidate_cache('get_descriptors')

    return HttpResponseRest(request, result)
