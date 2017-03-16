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
from organisation.models import Organisation

from .base import RestOrganisationModule
from .organisation import RestOrganisationId


class RestEstablishment(RestOrganisationModule):
    regex = r'^establishment/$'
    name = 'establishment'


class RestOrganisationIdEstablishment(RestOrganisationId):
    regex = r'^establishment/$'
    suffix = 'establishment'


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
