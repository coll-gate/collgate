# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
coll-gate descriptor module, descriptor format
"""
from django.views.decorators.cache import cache_page
from igdectk.rest import Format, Method
from igdectk.rest.response import HttpResponseRest

from .descriptor import RestDescriptor


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
    groups = []
    items = []

    from django.apps import apps
    descriptor_app = apps.get_app_config('descriptor')

    for group in descriptor_app.format_types:
        items.append({
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

    return HttpResponseRest(request, {'groups': groups, 'items': items})


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

    return HttpResponseRest(request, {'groups': groups, 'items': items})
