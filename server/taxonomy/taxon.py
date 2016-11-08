# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
coll-gate taxonomy taxon rest handlers
"""
from django.core.exceptions import SuspiciousOperation
from django.db.models import Q
from django.shortcuts import get_object_or_404

from permission.utils import get_permissions_for
from .base import RestTaxonomy

from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest
from .controller import Taxonomy
from .models import Taxon, TaxonRank, TaxonSynonym, TaxonSynonymType

from django.utils.translation import ugettext_lazy as _


class RestTaxonomySearch(RestTaxonomy):
    regex = r'^search/$'
    suffix = 'search'


class RestTaxonomyId(RestTaxonomy):
    regex = r'^(?P<id>[0-9]+)/$'
    suffix = 'id'


class RestTaxonomyIdSynonym(RestTaxonomyId):
    regex = r'^synonym/$'
    suffix = 'synonym'


class RestTaxonomyIdSynonymId(RestTaxonomyIdSynonym):
    regex = r'^(?P<sid>[0-9]+)/$'
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
    taxon_params = request.data

    parent_id = int_arg(taxon_params['parent'])
    parent = None
    if parent_id > 0:
        parent = get_object_or_404(Taxon, id=parent_id)

    taxon = Taxonomy.create_taxon(
        taxon_params['name'],
        int_arg(taxon_params['rank']),
        parent)

    response = {
        'id': taxon.id,
        'name': taxon.name,
        'rank': taxon.rank,
        'parent': taxon.parent.id,
        'parent_list': [int(x) for x in taxon.parent_list.rstrip(',').split(',')] if taxon.parent_list else [],
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
    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = request.GET.get('cursor')
    limit = results_per_page

    if request.GET.get('filters'):
        filters = json.loads(request.GET['filters'])

        if cursor:
            cursor_name, cursor_id = cursor.split('/')
            qs = Taxon.objects.filter(Q(name__gt=cursor_name))
        else:
            qs = Taxon.objects

        name = filters.get('name', '')
        rank = filters.get('rank')

        if filters.get('method', 'icontains') == 'icontains':
            qs = qs.filter(Q(synonyms__name__icontains=name))
        else:
            qs = qs.filter(Q(name__iexact=name)).filter(Q(synonyms__name__iexact=name))

        if rank:
            qs = qs.filter(Q(rank=rank))

        tqs = qs.prefetch_related('synonyms').order_by('name')[:limit]
    else:
        if cursor:
            cursor_name, cursor_id = cursor.split('/')
            qs = Taxon.objects.filter(Q(name__gt=cursor_name))
        else:
            qs = Taxon.objects.all()

        tqs = qs.prefetch_related('synonyms').order_by('name')[:limit]

    taxons_list = []
    for taxon in tqs:
        t = {
            'id': taxon.pk,
            'name': taxon.name,
            'parent': taxon.parent,
            'rank': taxon.rank,
            'parent_list': [int(x) for x in taxon.parent_list.rstrip(',').split(',')] if taxon.parent_list else [],
            'synonyms': []
        }

        for synonym in taxon.synonyms.all().order_by('type', 'language'):
            t['synonyms'].append({
                'id': synonym.id,
                'name': synonym.name,
                'type': synonym.type,
                'language': synonym.language
            })

        taxons_list.append(t)

    if len(taxons_list) > 0:
        # prev cursor (asc order)
        taxon = taxons_list[0]
        prev_cursor = "%s/%s" % (taxon['name'], taxon['id'])

        # next cursor (asc order)
        taxon = taxons_list[-1]
        next_cursor = "%s/%s" % (taxon['name'], taxon['id'])
    else:
        prev_cursor = None
        next_cursor = None

    results = {
        'perms': [],
        'items': taxons_list,
        'prev': prev_cursor,
        'cursor': cursor,
        'next': next_cursor,
    }

    return HttpResponseRest(request, results)


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

    parents = []
    next_parent = taxon.parent
    break_count = 0
    while break_count < 10 and next_parent is not None:
        parents.append({
            'id': next_parent.id,
            'name': next_parent.name,
            'rank': next_parent.rank,
            'parent': next_parent.parent_id
        })
        next_parent = next_parent.parent

    result = {
        'id': taxon.id,
        'name': taxon.name,
        'rank': taxon.rank,
        'parent': taxon.parent_id,
        'parent_list': [int(x) for x in taxon.parent_list.rstrip(',').split(',')] if taxon.parent_list else [],
        'parent_details': parents,
        'synonyms': [],
    }

    for s in taxon.synonyms.all().order_by('type', 'language'):
        result['synonyms'].append({
            'id': s.id,
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
    """
    Quick search for a taxon with a exact or partial name and a rank.
    """
    filters = json.loads(request.GET['filters'])
    page = int_arg(request.GET.get('page', 1))

    qs = None

    name_method = filters.get('method', 'ieq')

    if 'rank' in filters['fields']:
        rank = int_arg(filters['rank'])
        rank_method = filters.get('rank_method', 'lt')

        if name_method == 'ieq':
            qs = TaxonSynonym.objects.filter(Q(name__iexact=filters['name']))
        elif name_method == 'icontains':
            qs = TaxonSynonym.objects.filter(Q(name__icontains=filters['name']))

        if rank_method == 'eq':
            qs = qs.filter(Q(taxon__rank=rank))
        elif rank_method == 'lt':
            qs = qs.filter(Q(taxon__rank__lt=rank))
        elif rank_method == 'lte':
            qs = qs.filter(Q(taxon__rank__lte=rank))
        elif rank_method == 'gt':
            qs = qs.filter(Q(taxon__rank__gt=rank))
        elif rank_method == 'gte':
            qs = qs.filter(Q(taxon__rank__gte=rank))

    elif 'name' in filters['fields']:
        if name_method == 'ieq':
            qs = TaxonSynonym.objects.filter(name__iexact=filters['name'])
        elif name_method == 'icontains':
            qs = TaxonSynonym.objects.filter(name__icontains=filters['name'])

    qs = qs.select_related('taxon')

    # taxons_list = []
    # if qs:
    #     for s in qs:
    #         taxons_list.append({"id": str(s.taxon_id), "label": s.name, "value": s.name})

    # group by synonyms on labels
    taxons = {}

    for s in qs:
        taxon = taxons.get(s.taxon_id)
        if taxon:
            taxon['label'] += ', ' + s.name
        else:
            taxons[s.taxon_id] = {'id': str(s.taxon_id), 'label': s.name, 'value': s.taxon.name}

    taxons_list = list(taxons.values())

    response = {
        'items': taxons_list,
        'page': page
    }

    return HttpResponseRest(request, response)


@RestTaxonomyId.def_auth_request(
    Method.PATCH, Format.JSON, content={
        "type": "object",
        "properties": {
            "parent": {"type": ["number", "null"], 'required': False}
        },
    },
    perms={
        'taxonomy.change_taxon': _("You are not allowed to modify a taxon"),
    }
)
def patch_taxon(request, id):
    tid = int(id)

    taxon = get_object_or_404(Taxon, id=tid)

    result = {}

    if 'parent' in request.data:
        if request.data['parent'] is None:
            taxon.parent = None
            taxon.parent_list = ""

            result['parent'] = None
            result['parent_list'] = []
            result['parent_details'] = []
        else:
            ptid = int(request.data['parent'])

            parent = get_object_or_404(Taxon, id=ptid)

            taxon.parent = parent

            if parent.rank >= taxon.rank:
                raise SuspiciousOperation(_("The rank of the parent must be lowest than the taxon itself"))

            # make parent list
            Taxonomy.update_parents(taxon, parent)

            parents = []
            next_parent = taxon.parent
            break_count = 0
            while break_count < 10 and next_parent is not None:
                parents.append({
                    'id': next_parent.id,
                    'name': next_parent.name,
                    'rank': next_parent.rank,
                    'parent': next_parent.parent_id
                })
                next_parent = next_parent.parent

            result['parent'] = parent.id
            result['parent_list'] = parents
            result['parent_details'] = parents

    taxon.save()

    return HttpResponseRest(request, result)


@RestTaxonomyId.def_auth_request(Method.DELETE, Format.JSON, perms={
    'taxonomy.delete_taxon': _("You are not allowed to remove a taxon"),
})
def remove_taxon(request, id):
    tid = int(id)
    taxon = get_object_or_404(Taxon, id=tid)

    # TODO check if some accessions use it before remove

    taxon.remove_entity()

    return HttpResponseRest(request, {})


@RestTaxonomyIdSynonym.def_auth_request(
    Method.POST, Format.JSON, content={
        "type": "object",
        "properties": {
            "type": {"type:": "number"},
            "language": {"type:": "string", 'minLength': 2, 'maxLength': 5},
            "name": {"type": "string", 'minLength': 3, 'maxLength': 32}
        },
    },
    perms={
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


@RestTaxonomyIdSynonymId.def_auth_request(
    Method.PUT, Format.JSON, content={
        "type": "object",
        "properties": {
            "name": {"type": "string", 'minLength': 3, 'maxLength': 32}
        },
    },
    perms={
        'taxonomy.change_taxon': _("You are not allowed to modify a taxon"),
        'taxonomy.change_taxonsynonym': _("You are not allowed to modify a synonym to a taxon"),
    }
)
def taxon_change_synonym(request, id, sid):
    tid = int(id)
    sid = int(sid)

    synonym = get_object_or_404(TaxonSynonym, Q(id=sid), Q(taxon=tid))

    name = request.data['name']

    synonym.name = name

    synonym.full_clean()
    synonym.save()

    result = {
        'id': synonym.id,
        'name': synonym.name
    }

    return HttpResponseRest(request, result)


@RestTaxonomyIdSynonymId.def_auth_request(
    Method.DELETE, Format.JSON,
    perms={
        'taxonomy.change_taxon': _("You are not allowed to modify a taxon"),
        'taxonomy.delete_taxonsynonym': _("You are not allowed to delete a synonym from a taxon"),
    }
)
def taxon_remove_synonym(request, id, sid):
    tid = int(id)
    sid = int(sid)

    synonym = get_object_or_404(TaxonSynonym, Q(id=sid), Q(taxon=tid))

    if synonym.type == TaxonSynonymType.PRIMARY.value:
        raise SuspiciousOperation(_("It is not possible to removed a primary synonym"))

    synonym.delete()

    return HttpResponseRest(request, {})


@RestTaxonomyRank.def_request(Method.GET, Format.JSON)
def rank(request):
    """
    Get the list of taxon rank in JSON
    """

    taxon_ranks = []
    for tl in TaxonRank:
        taxon_ranks.append({
            'id': tl.value,
            'value': tl.value,
            'label': str(tl.label)
        })

    return HttpResponseRest(request, taxon_ranks)
