# -*- coding: utf-8; -*-
#
# @file formattype.py
# @brief 
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2016-09-01
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

"""
coll-gate descriptor module, descriptor format
"""
from django.core.exceptions import SuspiciousOperation
from django.views.decorators.cache import cache_page
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
    groups = []
    items = []

    from django.apps import apps
    descriptor_app = apps.get_app_config('descriptor')

    for group in descriptor_app.format_units:
        groups.append({
            'group': group.group,
            'label': str(group.label)
        })

        for ltype in group.items:
            items.append({
                'id': ltype.value,
                'group': group.group,
                'value': ltype.value,
                'label': str(ltype.label)
            })

    results = {
        'groups': groups,
        'items': items
    }

    return HttpResponseRest(request, results)

