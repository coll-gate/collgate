# -*- coding: utf-8; -*-
#
# Copyright (c) 2017 INRA UMR1095 GDEC

"""
coll-gate organisation organisation model REST API
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


class RestOrganisation(RestOrganisationModule):
    regex = r'^organisation/$'
    name = 'organisation'


class RestOrganisationId(RestOrganisation):
    regex = r'^(?P<org_id>[0-9]+)/$'
    suffix = 'id'


@RestOrganisation.def_auth_request(Method.GET, Format.JSON)
def get_organisation_list(request):
    """
    List all organisations.
    """

    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = request.GET.get('cursor')
    limit = results_per_page

    if cursor:
        cursor_name, cursor_id = cursor.rsplit('/', 1)
        qs = Organisation.objects.filter(Q(name__gt=cursor_name))
    else:
        qs = Organisation.objects.all()

    if request.GET.get('filters'):
        filters = json.loads(request.GET['filters'])

        name = filters.get('name', '')

        if filters.get('method', 'icontains') == 'icontains':
            qs = qs.filter(Q(name__icontains=name))
        else:
            qs = qs.filter(Q(name__iexact=name)).filter(Q(name__iexact=name))

    qs = qs.order_by('name')[:limit]

    items_list = []
    for organisation in qs:
        t = {
            'id': organisation.pk,
            'name': organisation.name,
            'num_establishment': organisation.establishments.count()
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
