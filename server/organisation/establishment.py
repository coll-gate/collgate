# -*- coding: utf-8; -*-
#
# Copyright (c) 2017 INRA UMR1095 GDEC

"""
coll-gate organisation establishment model REST API
"""

from django.core.exceptions import SuspiciousOperation
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils.translation import ugettext_lazy as _

from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest
from igdectk.module.manager import module_manager
from organisation.models import Organisation, Establishment

from .base import RestOrganisationModule
from .organisation import RestOrganisationId


class RestEstablishment(RestOrganisationModule):
    regex = r'^establishment/$'
    name = 'establishment'


class RestOrganisationIdEstablishment(RestOrganisationId):
    regex = r'^establishment/$'
    suffix = 'establishment'


class RestEstablishmentSearch(RestEstablishment):
    regex = r'^search/$'
    suffix = 'search'


@RestOrganisationIdEstablishment.def_auth_request(Method.GET, Format.JSON)
def get_establishment_list_for_organisation(request, org_id):
    """
    List all establishments for a specific organisation.
    """
    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = request.GET.get('cursor')
    limit = results_per_page

    filters = request.GET.get('filters')

    if filters:
        filters = json.loads(filters)

    organisation = get_object_or_404(Organisation, id=int(org_id))

    if cursor:
        cursor_name, cursor_id = cursor.rsplit('/', 1)
        qs = organisation.establishments.filter(Q(name__gt=cursor_name))
    else:
        qs = organisation.establishments.all()

    if filters:
        name = filters.get('name')

        if name:
            if filters.get('method', 'icontains') == 'icontains':
                qs = qs.filter(Q(name__icontains=name))
            else:
                qs = qs.filter(Q(name__iexact=name))

    qs = qs.select_related("organisation").order_by('name')[:limit]

    items_list = []
    for establishment in qs:
        t = {
            'id': establishment.pk,
            'name': establishment.name,
            'descriptors': establishment.descriptors,
            'descriptor_meta_model': establishment.descriptor_meta_model,
            'organisation': establishment.organisation_id,
            'organisation_details': {
                'id': establishment.organisation.id,
                'name': establishment.organisation.name
            }
        }

        items_list.append(t)

    if len(items_list) > 0:
        # prev cursor (asc order)
        item = items_list[0]
        prev_cursor = "%s/%s" % (item['name'], item['id'])

        # next cursor (asc order)
        item = items_list[-1]
        next_cursor = "%s/%s" % (item['name'], item['id'])
    else:
        prev_cursor = None
        next_cursor = None

    results = {
        'perms': [],
        'items': items_list,
        'prev': prev_cursor,
        'cursor': cursor,
        'next': next_cursor,
    }

    return HttpResponseRest(request, results)


@RestEstablishmentSearch.def_auth_request(Method.GET, Format.JSON, ('filters',))
def search_establishment(request):
    """
    Quick search for an establishment with a exact or partial name.
    """
    filters = json.loads(request.GET['filters'])

    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = request.GET.get('cursor')
    limit = results_per_page

    if cursor:
        cursor_name, cursor_id = cursor.rsplit('/', 1)
        qs = Establishment.objects.filter(Q(name__gt=cursor_name))
    else:
        qs = Establishment.objects.all()

    if 'name' in filters['fields']:
        name_method = filters.get('method', 'ieq')

        if name_method == 'ieq':
            qs = qs.filter(name__iexact=filters['name'])
        elif name_method == 'icontains':
            qs = qs.filter(name__icontains=filters['name'])

    qs = qs.order_by('name').distinct()[:limit]

    items_list = []

    for establishment in qs:
        label = "%s (%s)" % (establishment.name, establishment.descriptors['establishment_code'])

        a = {
            'id': establishment.id,
            'label': label,
            'value': establishment.name
        }

        items_list.append(a)

    if len(items_list) > 0:
        # prev cursor (asc order)
        obj = items_list[0]
        prev_cursor = "%s/%i" % (obj['value'], obj['id'])

        # next cursor (asc order)
        obj = items_list[-1]
        next_cursor = "%s/%i" % (obj['value'], obj['id'])
    else:
        prev_cursor = None
        next_cursor = None

    results = {
        'perms': [],
        'items': items_list,
        'prev': prev_cursor,
        'cursor': cursor,
        'next': next_cursor,
    }

    return HttpResponseRest(request, results)
