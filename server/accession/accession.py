# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
coll-gate accession rest handler
"""
from django.db.models import Q

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
        'accession.add_accession': _("You are not allowed to create an accession")
    }
)
def create_accession(request):
    accession = request.data['accession']

    accession = Accession.create_accession(
        accession['name'],
    )

    # @todo

    response = {
        'id': accession.pk,
        'name': accession.name,
    }

    return HttpResponseRest(request, response)


@RestAccessionAccession.def_auth_request(Method.GET, Format.JSON,
    perms={
        'accession.list_accession': _("You are not allowed to list the accessions")
    }
)
def accession_list(request):
    accessions = Accession.objects.all()
    synonyms = AccessionSynonym.objects.all()

    # @todo

    response = {
        'accessions': accessions,
        'synonyms': synonyms,
    }

    return HttpResponseRest(request, response)


@RestAccessionSearch.def_auth_request(Method.GET, Format.JSON, ('filters',))
def search_accession(request):
    """
    Quick search for an accession with a exact or partial name and meta model of descriptor.
    """
    filters = json.loads(request.GET['filters'])
    page = int_arg(request.GET.get('page', 1))

    qs = None

    name_method = filters.get('method', 'ieq')
    if 'meta_model' in filters['fields']:
        meta_model = int_arg(filters['meta_model'])

        if name_method == 'ieq':
            qs = AccessionSynonym.objects.filter(Q(name__iexact=filters['name']))
        elif name_method == 'icontains':
            qs = AccessionSynonym.objects.filter(Q(name__icontains=filters['name']))

        qs = qs.filter(Q(descriptor_meta_model_id=meta_model))
    elif 'name' in filters['fields']:
        if name_method == 'ieq':
            qs = AccessionSynonym.objects.filter(name__iexact=filters['name'])
        elif name_method == 'icontains':
            qs = AccessionSynonym.objects.filter(name__icontains=filters['name'])

    #qs = qs.select_related('accession')

    # group by synonyms on labels
    accessions = {}

    for s in qs:
        accession = accessions.get(s.taxon_id)
        if accession:
            accession['label'] += ', ' + s.name
        else:
            accessions[s.taxon_id] = {'id': str(s.accession_id), 'label': s.name, 'value': s.accession.name}
    accessions_list = list(accessions.values())

    response = {
        'items': accessions_list,
        'page': page
    }

    return HttpResponseRest(request, response)
