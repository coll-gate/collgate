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
from organisation.organisation import filter_organisation
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

    filters = request.GET.get('filters')

    if filters:
        filters = json.loads(filters)

    results = filter_organisation(filters, cursor, limit, True)
    return HttpResponseRest(request, results)
