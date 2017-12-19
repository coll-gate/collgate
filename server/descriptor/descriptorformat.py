# -*- coding: utf-8; -*-
#
# @file descriptorformat.py
# @brief coll-gate descriptor module, descriptor format
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2016-09-01
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

from django.core.exceptions import SuspiciousOperation
from django.views.decorators.cache import cache_page

from descriptor.descriptorformatunit import DescriptorFormatUnitManager
from igdectk.rest import Format, Method
from igdectk.rest.response import HttpResponseRest

from .descriptor import RestDescriptor
from .descriptorformattype import DescriptorFormatTypeManager


class RestDescriptorFormat(RestDescriptor):
    regex = r'^format/$'
    suffix = 'format'


class RestDescriptorFormatType(RestDescriptorFormat):
    regex = r'^type/$'
    suffix = 'type'


class RestDescriptorFormatUnit(RestDescriptorFormat):
    regex = r'^unit/$'
    suffix = 'unit'


@cache_page(60*60*24)
@RestDescriptorFormatType.def_request(Method.GET, Format.JSON)
def get_format_type_list(request):
    """
    Return the list of types of format.
    """
    groups = {}
    items = {}

    for ft in DescriptorFormatTypeManager.values():
        if ft.group:
            if ft.group.name not in groups:
                groups[ft.group.name] = {
                    'group': ft.group.name,
                    'label': str(ft.group.verbose_name)
                }

        if ft.name in items:
            raise SuspiciousOperation("Already registered descriptor format type %s" % ft.name)

        items[ft.name] = {
            'id': ft.name,
            'group': ft.group.name,
            'value': ft.name,
            'label': str(ft.verbose_name)
        }

    groups_list = sorted(list(groups.values()), key=lambda x: x['group'])
    items_list = sorted(list(items.values()), key=lambda x: x['id'])

    results = {
        'groups': groups_list,
        'items': items_list
    }

    return HttpResponseRest(request, results)


@cache_page(60*60*24)
@RestDescriptorFormatUnit.def_request(Method.GET, Format.JSON)
def get_format_unit_list(request):
    """
    Return the list of units of format.
    """
    groups = {}
    items = {}

    for fu in DescriptorFormatUnitManager.values():
        if fu.group:
            if fu.group.name not in groups:
                groups[fu.group.name] = {
                    'group': fu.group.name,
                    'label': str(fu.group.verbose_name)
                }

        if fu.name in items:
            raise SuspiciousOperation("Already registered descriptor format unit %s" % fu.name)

        items[fu.name] = {
            'id': fu.name,
            'group': fu.group.name,
            'value': fu.name,
            'label': str(fu.verbose_name)
        }

    groups_list = sorted(list(groups.values()), key=lambda x: x['group'])
    items_list = sorted(list(items.values()), key=lambda x: x['id'])

    results = {
        'groups': groups_list,
        'items': items_list
    }

    return HttpResponseRest(request, results)
