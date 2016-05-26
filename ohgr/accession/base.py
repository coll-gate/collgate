# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
ohgr accession rest handler
"""
from django.db.models import Q
from django.shortcuts import render, get_object_or_404

from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest
from igdectk.rest.restmiddleware import HttpResponseUnauthorized

from main.models import Languages, SynonymType
from .models import Accession, AccessionSynonym
# from .controller import Accession

from django.utils.translation import ugettext_lazy as _


class RestAccession(RestHandler):
    regex = r'^accession/$'
    name = 'accession'


class RestAccessionSearch(RestAccession):
    regex = r'^search/$'
    suffix = 'search'


class RestAccessionId(RestAccession):
    regex = r'^(?P<id>[0-9]+)/$'
    suffix = 'id'


class RestAccessionSynonym(RestAccession):
    regex = r'^synonym/$'
    suffix = 'synonym'


@RestAccession.def_auth_request(Method.POST, Format.JSON, content={
    "type": "object",
    "properties": {
        "accession": {
            "type": "object",
            "properties": {
                "name": {"type": "string", 'minLength': 3, 'maxLength': 32},
            },
        },
    },
}, perms={'accession.add_accession', _("You are not allowed to create an accession")})
def create_accession(request):
    accession = request.data['accession']

    accession = Accession.create_accession(
        accession['name'],
    )

    response = {
        'result': 'success',
        'id': accession.pk,
    }

    return HttpResponseRest(request, response)


@RestAccession.def_auth_request(Method.GET, Format.JSON,
                                perms={'accession.list_accession', _("You are not allowed to list the accessions")})
def accession_list(request):
    accessions = Accession.objects.all()
    synonyms = AccessionSynonym.objects.all()

    response = {
        'result': 'success',
        'accessions': accessions,
        'synonyms': synonyms,
    }

    return HttpResponseRest(request, response)
