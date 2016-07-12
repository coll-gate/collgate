# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
ohgr taxonomy taxon rest handlers
"""
from django.db.models import Q, Prefetch
from django.shortcuts import get_object_or_404

from permission.utils import get_permissions_for
from .base import RestTaxonomy

from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest
from .controller import Taxonomy
from .models import Taxon, TaxonRank, TaxonSynonym

from django.utils.translation import ugettext_noop as _


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
        "name": {"type": "string", 'minLength': 3, 'maxLength': 32},
        "rank": {"type": "number", 'minimum': 0, 'maximum': 100},
        "parent": {"type": "number", 'minimum': 0},
    },
}, perms={'taxonomy.add_taxon': _('You are not allowed to create a taxon')}
)
def create_taxon(request):
    taxon = request.data

    parent_id = int_arg(taxon['parent'])
    parent = None
    if parent_id > 0:
        parent = get_object_or_404(Taxon, id=parent_id)

    taxon = Taxonomy.create_taxon(
        taxon['name'],
        int_arg(taxon['rank']),
        parent)

    response = {
        'id': taxon.id,
        'name': taxon.name,
        'rank': taxon.rank,
        'parent': taxon.parent,
        'synonyms': [],
    }

    for s in taxon.synonyms.all():
        response['synonyms'].append({
            'name': s.name,
            'type': s.type,
            'language': s.language,
        })

    return HttpResponseRest(request, response)


@RestTaxonomy.def_auth_request(Method.OPTIONS, Format.JSON)
def opt_taxon_list(request):
    response = {
        'perms': get_permissions_for(request.user, "taxonomy", "taxon")
    }
    return HttpResponseRest(request, response)


@RestTaxonomy.def_auth_request(Method.GET, Format.JSON)
def get_taxon_list(request):
    results_per_page = 10
    page = int_arg(request.GET.get('page', 1))
    offset = (page-1) * results_per_page
    limit = offset + results_per_page

    taxons = Taxon.objects.prefetch_related('synonyms').all()[offset:limit]

    taxons_list = []
    for taxon in taxons:
        t = {
            'id': taxon.pk,
            'name': taxon.name,
            'parent': taxon.parent,
            'parent_list': taxon.parent_list.split(','),
            'synonyms': []
        }

        for synonym in taxon.synonyms.all():
            t['synonyms'].append({
                'id': synonym.id,
                'name': synonym.name,
                'type': synonym.type,
                'language': synonym.language
            })

        taxons_list.append(t)

    response = {
        'items': taxons_list,
        'total_count': Taxon.objects.all().count(),
        'page': 1,
    }

    return HttpResponseRest(request, response)


@RestTaxonomyId.def_auth_request(Method.OPTIONS, Format.JSON)
def opt_taxon_list(request, id):
    taxon = get_object_or_404(Taxon, id=int_arg(id))
    response = {
        'perms': get_permissions_for(request.user, "taxonomy", "taxon", taxon)
    }
    return HttpResponseRest(request, response)


@RestTaxonomyId.def_auth_request(Method.GET, Format.JSON)
def get_taxon_details_json(request, id):
    taxon = Taxon.objects.get(id=int_arg(id))

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


@RestTaxonomySearch.def_auth_request(Method.OPTIONS, Format.JSON)
def opt_search_taxon(request):
    response = {
        'perms': get_permissions_for(request.user, "taxonomy", "taxon")
    }
    return HttpResponseRest(request, response)


@RestTaxonomySearch.def_auth_request(Method.GET, Format.JSON, ('filters',))
def search_taxon(request):
    filters = json.loads(request.GET['filters'])
    page = int_arg(request.GET.get('page', 1))

    taxons = None
    synonyms = None

    # TODO for rank search with taxon but into synonym too, then select_related... join...
    if 'rank' in filters['fields']:
        rank = int_arg(filters['rank'])
        # taxons = Taxon.objects.filter(Q(name__icontains=filters['name']), Q(rank__lt=rank))
        if filters['method'] == 'ieq':
            synonyms = TaxonSynonym.objects.filter(Q(name=filters['name']), Q(taxon__rank__lt=rank))
        elif filters['method'] == 'icontains':
            synonyms = TaxonSynonym.objects.filter(Q(name__icontains=filters['name']), Q(taxon__rank__lt=rank))
    elif filters['method'] == 'ieq' and 'name' in filters['fields']:
        # taxons = Taxon.objects.filter(name__iexact=filters['name'])
        synonyms = TaxonSynonym.objects.filter(name__iexact=filters['name'])
    elif filters['method'] == 'icontains' and 'name' in filters['fields']:
        synonyms = TaxonSynonym.objects.filter(name__icontains=filters['name'])

    taxons_list = []

    if synonyms:
        for s in synonyms:
            taxons_list.append({"id": str(s.taxon_id), "label": s.name, "value": s.name})

    if taxons:
        for t in taxons:
            taxons_list.append({"id": str(t.id), "label": t.name, "value": t.name})

    response = {
        'items': taxons_list,
        'page': page
    }

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

    return HttpResponseRest(request, {})


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

    return HttpResponseRest(request, {})


@RestTaxonomyRank.def_request(Method.GET, Format.JSON)
def rank(request):
    """
    Get the list of taxon rank in JSON
    """

    taxon_ranks = []
    for tl in TaxonRank:
        taxon_ranks.append({'id': tl.value, 'value': str(tl.label)})

    return HttpResponseRest(request, taxon_ranks)
