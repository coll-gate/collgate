# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
Views related to the taxon synonym model.
"""
from django.db.models import Q
from django.views.decorators.cache import cache_page

from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest
from .models import TaxonSynonymType, TaxonSynonym

from .base import RestTaxonomy
from .taxon import RestTaxon


class RestTaxonSynonymType(RestTaxonomy):
    regex = r'^taxon-synonym-type/$'
    name = 'taxon-synonym-type'


class RestTaxonSynonym(RestTaxon):
    regex = r'^synonym/$'
    suffix = 'synonym'


class RestTaxonSynonymSearch(RestTaxonSynonym):
    regex = r'^search/$'
    suffix = 'search'


@cache_page(60*60*24)
@RestTaxonSynonymType.def_request(Method.GET, Format.JSON)
def synonym_type(request):
    """
    Get the list of type of synonym in JSON
    """
    synonym_types = []

    for st in TaxonSynonymType:
        synonym_types.append({
            'id': st.value,
            'value': st.value,
            'label': str(st.label)
        })

    return HttpResponseRest(request, synonym_types)


@RestTaxonSynonymSearch.def_auth_request(Method.GET, Format.JSON, ('filters',))
def search_taxon_synonym(request):
    """
    Quick search for a taxon synonym with a exact or partial name.
    """
    filters = json.loads(request.GET['filters'])

    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = request.GET.get('cursor')
    limit = results_per_page

    # @todo problem pour le cursor, on doit peut etre utilise id+synonym car doublon de synonym possibles
    # et pas bon sur le cursor (value) (pareil que sur accessionsynonym)
    if cursor:
        cursor_name, cursor_id = cursor.rsplit('/', 1)
        qs = TaxonSynonym.objects.filter(Q(synonym__gt=cursor_name))
    else:
        qs = TaxonSynonym.objects.all()

    if 'name' in filters['fields']:
        name_method = filters.get('method', 'ieq')

        if name_method == 'ieq':
            qs = qs.filter(synonym__iexact=filters['name'])
        elif name_method == 'icontains':
            qs = qs.filter(synonym__icontains=filters['name'])

    qs = qs.order_by('name')[:limit]

    items_list = []

    for synonym in qs:
        s = {
            'id': synonym.id,
            'label': synonym.synonym,
            'value': synonym.name,
            'type': synonym.type,
            'taxon': synonym.taxon_id
        }

        items_list.append(s)

    if len(items_list) > 0:
        # prev cursor (asc order)
        obj = items_list[0]
        prev_cursor = "%s/%i" % (obj['value'], obj['id'])

        # next cursor (asc order)
        obj = items_list[-1]
        next_cursor = "%s/%i" % (obj['value'], obj['id'])
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
