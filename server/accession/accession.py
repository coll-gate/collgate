# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
coll-gate accession rest handler
"""

from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest

from .models import Accession, AccessionSynonym
from .base import RestAccession

from django.utils.translation import ugettext_lazy as _


class RestAccessionAccession(RestAccession):
    regex = r'^accession/$'
    name = 'accession'


class RestAccessionSearch(RestAccessionAccession):
    regex = r'^search/$'
    suffix = 'search'


class RestAccessionId(RestAccessionAccession):
    regex = r'^(?P<id>[0-9]+)/$'
    suffix = 'id'


class RestAccessionSynonym(RestAccessionAccession):
    regex = r'^synonym/$'
    suffix = 'synonym'


@RestAccessionAccession.def_auth_request(Method.POST, Format.JSON, content={
        "type": "object",
        "properties": {
            "accession": {
                "type": "object",
                "properties": {
                    "name": {"type": "string", 'minLength': 3, 'maxLength': 32},
                },
            },
        },
    }, perms={
        'accession.add_accession', _("You are not allowed to create an accession")
    }
)
def create_accession(request):
    accession = request.data['accession']

    accession = Accession.create_accession(
        accession['name'],
    )

    response = {
        'id': accession.pk,
        'name': accession.name,
    }

    return HttpResponseRest(request, response)


@RestAccessionAccession.def_auth_request(Method.GET, Format.JSON,
    perms={
        'accession.list_accession', _("You are not allowed to list the accessions")
    }
)
def accession_list(request):
    accessions = Accession.objects.all()
    synonyms = AccessionSynonym.objects.all()

    response = {
        'accessions': accessions,
        'synonyms': synonyms,
    }

    return HttpResponseRest(request, response)
