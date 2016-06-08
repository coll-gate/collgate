# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
ohgr taxonomy rest handler
"""
from django.db.models import Q
from django.shortcuts import get_object_or_404

from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest
from main.models import Languages, SynonymType
from .controller import Taxonomy
from .models import Taxon, TaxonRank, TaxonSynonym

from django.utils.translation import ugettext_noop as _


class RestTaxonomy(RestHandler):
    regex = r'^taxonomy/$'
    name = 'taxon'


class RestTaxonomySearch(RestTaxonomy):
    regex = r'^search/$'
    suffix = 'search'


class RestTaxonomyId(RestTaxonomy):
    regex = r'^(?P<id>[0-9]+)/$'
    suffix = 'id'


class RestTaxonomySynonym(RestTaxonomy):
    regex = r'^synonym/$'
    suffix = 'synonym'


class RestTaxonomyRank(RestTaxonomy):
    regex = r'^rank/$'
    suffix = 'rank'


@RestTaxonomy.def_auth_request(Method.POST, Format.JSON, content={
    "type": "object",
    "properties": {
        "taxon": {
            "type": "object",
            "properties": {
                "name": {"type": "string", 'minLength': 3, 'maxLength': 32},
                "rank": {"type": "number", 'minimum': 0, 'maximum': 100},
                "parent": {"type": "number", 'minimum': 0},
            },
        },
    },
}, perms={'taxonomy.add_taxon': _('You are not allowed to create a taxon')}
)
def create_taxon(request):
    taxon = request.data['taxon']

    parent_id = int_arg(taxon['parent'])
    parent = None
    if parent_id > 0:
        parent = get_object_or_404(Taxon, id=parent_id)

    taxon = Taxonomy.create_taxon(
        taxon['name'],
        int_arg(taxon['rank']),
        parent)

    response = {
        'result': 'success',
        'id': taxon.pk,
    }

    return HttpResponseRest(request, response)


@RestTaxonomy.def_auth_request(Method.GET, Format.JSON)
def taxon_list(request):
    taxons = Taxon.objects.all()
    synonyms = TaxonSynonym.objects.all()

    response = {
        'result': 'success',
        'taxons': taxons,
        'synonyms': synonyms,
    }

    return HttpResponseRest(request, response)


@RestTaxonomyId.def_auth_request(Method.GET, Format.JSON)
def taxon_details_json(request, id):
    taxon = Taxon.objects.get(id=str(id))

    result = {
        'id': taxon.id,
        'name': taxon.name,
        'rank': taxon.rank,
        'synonyms': [],
    }

    for s in taxon.synonyms.all():
        result['synonyms'].append({
            'name': s.name,
            'type': s.type,
            'language': s.language,
        })

    return HttpResponseRest(request, result)


@RestTaxonomySearch.def_auth_request(Method.GET, Format.JSON, ('term', 'type', 'mode'))
def search_taxon(request):
    taxons = None
    synonyms = None

    # TODO for rank search with taxon but into synonym too, then select_related... join...
    if 'rank' in request.GET:
        rank = int_arg(request.GET['rank'])
        # taxons = Taxon.objects.filter(Q(name__icontains=request.GET['term']), Q(rank__lt=rank))
        if request.GET['mode'] == 'ieq':
            synonyms = TaxonSynonym.objects.filter(Q(name=request.GET['term']), Q(taxon__rank__lt=rank))
        elif request.GET['mode'] == 'icontains':
            synonyms = TaxonSynonym.objects.filter(Q(name__icontains=request.GET['term']), Q(taxon__rank__lt=rank))
    elif request.GET['mode'] == 'ieq' and request.GET['type'] == 'name':
        # taxons = Taxon.objects.filter(name__iexact=request.GET['term'])
        synonyms = TaxonSynonym.objects.filter(name__iexact=request.GET['term'])
    elif request.GET['mode'] == 'icontains' and request.GET['type'] == 'name':
        synonyms = TaxonSynonym.objects.filter(name__icontains=request.GET['term'])

    response = []

    if synonyms:
        for s in synonyms:
            response.append({"id": str(s.taxon_id), "label": s.name, "value": s.name})

    if taxons:
        for t in taxons:
            response.append({"id": str(t.id), "label": t.name, "value": t.name})

    return HttpResponseRest(request, response)


@RestTaxonomyId.def_auth_request(
    Method.PUT, Format.JSON, content=('type', 'name', 'language'), perms={
        'taxonomy.change_taxon': _("You are not allowed to modify a taxon"),
        'taxonomy.add_taxonsynonym': _("You are not allowed to add a synonym to a taxon"),
    }
)
def taxon_add_synonym(request, id):
    taxon_id = int_arg(id)
    taxon = get_object_or_404(Taxon, id=taxon_id)

    synonym = {
        'type': int(request.data['type']),
        'name': str(request.data['name']),
        'language': str(request.data['language']),
    }

    Taxonomy.add_synonym(taxon, synonym)
    response = {'result': 'success'}

    return HttpResponseRest(request, response)


@RestTaxonomyId.def_auth_request(
    Method.DELETE, Format.JSON, content=('type', 'name', 'language'),
    perms={
        'taxonomy.change_taxon': _("You are not allowed to modify a taxon"),
        'taxonomy.delete_taxonsynonym': _("You are not allowed to delete a synonym from a taxon"),
    }
)
def taxon_remove_synonym(request, id):
    taxon_id = int_arg(id)
    taxon = get_object_or_404(Taxon, id=taxon_id)

    synonym = {
        'type': int(request.data['type']),
        'name': str(request.data['name']),
        'language': str(request.data['language']),
    }

    Taxonomy.remove_synonym(taxon, synonym)
    response = {'result': 'success'}

    return HttpResponseRest(request, response)


@RestTaxonomyRank.def_request(Method.GET, Format.JSON)
def rank(request):
    """
    Get the list of taxon rank in JSON
    """

    taxon_ranks = []
    for tl in TaxonRank:
        taxon_ranks.append({'id': tl.value, 'value': str(tl.label)})

    return HttpResponseRest(request, taxon_ranks)
