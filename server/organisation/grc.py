# -*- coding: utf-8; -*-
#
# Copyright (c) 2017 INRA UMR1095 GDEC

"""
coll-gate organisation REST API
"""

from django.db.models import Q
from django.utils.translation import ugettext_lazy as _

from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest
from organisation.models import GRC
from .base import RestOrganisationModule


class RestGRC(RestOrganisationModule):
    regex = r'^grc/$'
    name = 'grc'


class RestGRCOrganisation(RestGRC):
    regex = r'^organisation/$'
    name = 'organisation'


@RestGRC.def_auth_request(Method.GET, Format.JSON)
def get_grc_details(request):
    """
    Get details of the unique GRC model instance.
    """

    # take the unique GRC instance
    grc = GRC.objects.all()[0]

    response = {
        'id': grc.id,
        'name': grc.name,
        'identifier': grc.identifier,
        'description': grc.description
    }

    return HttpResponseRest(request, response)


@RestGRC.def_auth_request(Method.PUT, Format.JSON, content={
    "type": "object",
    "properties": {
        "name": GRC.NAME_VALIDATOR,
        "identifier": GRC.IDENTIFIER_VALIDATOR,
        "description": {"type": "string", 'minLength': 0, 'maxLength': 4096},
    },
}, perms={'organisation.change_grc': _('You are not allowed to modify the GRC')}
)
def update_grc(request):
    """
    Update the unique GRC model instance.
    """

    # take the unique GRC instance
    grc = GRC.objects.all()[0]

    grc.name = request.data.get('name')
    grc.identifier = request.data.get('identifier')
    grc.description = request.data.get('description')

    grc.save()

    response = {
        'id': grc.id,
        'name': grc.name,
        'identifier': grc.identifier,
        'description': grc.description
    }

    return HttpResponseRest(request, response)


@RestGRCOrganisation.def_auth_request(Method.GET, Format.JSON)
def get_grc_organisation_list(request):
    """
    List of organisations related to the GRC.
    """

    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = request.GET.get('cursor')
    limit = results_per_page

    organisations = GRC.objects.all()[0].organisations

    if cursor:
        cursor_name, cursor_id = cursor.rsplit('/', 1)
        qs = organisations.filter(Q(name__gt=cursor_name))
    else:
        qs = organisations.all()

    if request.GET.get('filters'):
        filters = json.loads(request.GET['filters'])

        name = filters.get('name', '')
        organisation_type = filters.get('type')

        if filters.get('method', 'icontains') == 'icontains':
            qs = qs.filter(Q(name__icontains=name))
        else:
            qs = qs.filter(Q(name__iexact=name))

        if organisation_type:
            if filters.get('type_method', 'eq') == 'eq':
                qs = qs.filter(Q(type=organisation_type))
            else:
                qs = qs.exclude(Q(type=organisation_type))

    qs = qs.order_by('name')[:limit]

    items_list = []
    for organisation in qs:
        t = {
            'id': organisation.pk,
            'name': organisation.name,
            'type': organisation.type,
            'descriptors': organisation.descriptors,
            'num_establishments': organisation.establishments.count()
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
