# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
Views related to the taxon synonym model.
"""

from django.core.exceptions import SuspiciousOperation
from django.db import IntegrityError
from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.views.decorators.cache import cache_page
from django.utils.translation import ugettext_lazy as _

from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest
from .models import TaxonSynonymType, TaxonSynonym, Taxon

from .base import RestTaxonomy
from .taxon import RestTaxon, RestTaxonId


class RestTaxonSynonymType(RestTaxonomy):
    regex = r'^taxon-synonym-type/$'
    name = 'taxon-synonym-type'


class RestTaxonSynonym(RestTaxon):
    regex = r'^synonym/$'
    suffix = 'synonym'


class RestTaxonSynonymSearch(RestTaxonSynonym):
    regex = r'^search/$'
    suffix = 'search'


class RestTaxonIdSynonym(RestTaxonId):
    regex = r'^synonym/$'
    suffix = 'synonym'


class RestTaxonIdSynonymId(RestTaxonIdSynonym):
    regex = r'^(?P<syn_id>[0-9]+)/$'
    suffix = 'id'


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

    if cursor:
        cursor_synonym, cursor_id = cursor.rsplit('/', 1)
        qs = TaxonSynonym.objects.filter(Q(synonym__gt=cursor_synonym) | (
            Q(synonym=cursor_synonym) & Q(id__gt=cursor_id)))
    else:
        qs = TaxonSynonym.objects.all()

    if 'name' in filters['fields']:
        name_method = filters.get('method', 'ieq')

        if name_method == 'ieq':
            qs = qs.filter(synonym__iexact=filters['name'])
        elif name_method == 'icontains':
            qs = qs.filter(synonym__icontains=filters['name'])

    qs = qs.order_by('name', 'id')[:limit]

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
        prev_cursor = "%s/%i" % (obj['label'], obj['id'])

        # next cursor (asc order)
        obj = items_list[-1]
        next_cursor = "%s/%i" % (obj['label'], obj['id'])
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


@RestTaxonIdSynonym.def_auth_request(
    Method.POST, Format.JSON, content={
        "type": "object",
        "properties": {
            "type": {"type:": "number"},
            "language": TaxonSynonym.LANGUAGE_VALIDATOR,
            "name": TaxonSynonym.NAME_VALIDATOR
        },
    },
    perms={
        'taxonomy.change_taxon': _("You are not allowed to modify a taxon"),
        'taxonomy.add_taxonsynonym': _("You are not allowed to add a synonym to a taxon"),
    }
)
def taxon_add_synonym(request, tax_id):
    taxon = get_object_or_404(Taxon, id=int(tax_id))

    result = {
        'type': int(request.data['type']),
        'name': request.data['name'],
        'language': request.data['language']
    }

    # Taxonomy.add_synonym(taxon, result)

    # check that type is in the values of descriptor
    if not TaxonSynonym.is_synonym_type(result['type']):
        raise SuspiciousOperation(_("Unsupported type of synonym"))

    # check if a similar synonyms exists into the taxon or as primary name for another taxon
    synonyms = TaxonSynonym.objects.filter(synonym__iexact=result['name'])

    for synonym in synonyms:
        # at least one usage, not compatible with primary synonym
        if result['type'] == TaxonSynonymType.PRIMARY.value:
            raise SuspiciousOperation(_("The primary name could not be used by another synonym of taxon"))

        # already used by another taxon as primary name
        if synonym.is_primary():
            raise SuspiciousOperation(_("Synonym already used as a primary name"))

        # already used by this taxon
        if synonym.taxon_id == int(tax_id):
            raise SuspiciousOperation(_("Synonym already used into this taxon"))

    taxon_synonym = TaxonSynonym(
        taxon=taxon,
        name="%s_%s" % (taxon.name, result['name']),
        synonym=result['name'],
        language=result['language'],
        type=result['type'])

    taxon_synonym.save()

    taxon.synonyms.add(taxon_synonym)

    result['id'] = taxon_synonym.id

    return HttpResponseRest(request, {})


@RestTaxonIdSynonymId.def_auth_request(
    Method.PUT, Format.JSON, content={
        "type": "object",
        "properties": {
            "name": TaxonSynonym.NAME_VALIDATOR
        },
    },
    perms={
        'taxonomy.change_taxon': _("You are not allowed to modify a taxon"),
        'taxonomy.change_taxonsynonym': _("You are not allowed to modify a synonym to a taxon"),
    }
)
def taxon_change_synonym(request, tax_id, syn_id):
    taxon = get_object_or_404(Taxon, id=int(tax_id))
    taxon_synonym = taxon.synonyms.get(id=int(syn_id))

    name = request.data['name']

    # no changes
    if name == taxon.name:
        return HttpResponseRest(request, {})

    # check if a similar synonyms exists into the taxon or as primary name for another taxon
    synonyms = TaxonSynonym.objects.filter(synonym__iexact=name).exclude(id=int(syn_id))

    for synonym in synonyms:
        # at least one usage, not compatible with primary synonym
        if taxon_synonym.type == TaxonSynonymType.PRIMARY.value:
            raise SuspiciousOperation(_("The primary name could not be used by another synonym of taxon"))

        # already used by another taxon as primary name
        if synonym.is_primary():
            raise SuspiciousOperation(_("Synonym already used as a primary name"))

        # already used by this taxon
        if synonym.taxon_id == tax_id:
            raise SuspiciousOperation(_("Synonym already used into this taxon"))

    try:
        with transaction.atomic():
            # rename the taxon if the synonym name is the taxon name
            if taxon.name == taxon_synonym.synonym:
                taxon.name = name
                taxon.save()

            taxon_synonym.name = "%s_%s" % (taxon.name, name)
            taxon_synonym.synonym = name
            taxon_synonym.save()

            result = {
                'id': taxon_synonym.id,
                'name': taxon_synonym.synonym
            }
    except IntegrityError as e:
        logger.log(repr(e))
        raise SuspiciousOperation(_("Unable to rename a synonym of a taxon"))

    return HttpResponseRest(request, result)


@RestTaxonIdSynonymId.def_auth_request(
    Method.DELETE, Format.JSON,
    perms={
        'taxonomy.change_taxon': _("You are not allowed to modify a taxon"),
        'taxonomy.delete_taxonsynonym': _("You are not allowed to delete a synonym from a taxon"),
    }
)
def taxon_remove_synonym(request, tax_id, syn_id):
    synonym = get_object_or_404(TaxonSynonym, Q(id=int(syn_id)), Q(taxon=int(tax_id)))

    if synonym.type == TaxonSynonymType.PRIMARY.value:
        raise SuspiciousOperation(_("It is not possible to remove a primary synonym"))

    synonym.delete()

    return HttpResponseRest(request, {})
