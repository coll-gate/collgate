# -*- coding: utf-8; -*-
#
# @file accessionsynonym.py
# @brief Views related to the accession synonym model.
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2016-09-01
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

from django.core.exceptions import SuspiciousOperation
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils.translation import ugettext_lazy as _

from accession.models import AccessionSynonym, Accession
from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest
from main.models import EntitySynonymType
from .accession import RestAccessionAccession, RestAccessionId


class RestAccessionSynonym(RestAccessionAccession):
    regex = r'^synonym/$'
    suffix = 'synonym'


class RestAccessionSynonymSearch(RestAccessionSynonym):
    regex = r'^search/$'
    suffix = 'search'


class RestAccessionIdSynonym(RestAccessionId):
    regex = r'^synonym/$'
    suffix = 'synonym'


class RestAccessionIdSynonymId(RestAccessionIdSynonym):
    regex = r'^(?P<syn_id>[0-9]+)/$'
    suffix = 'id'


@RestAccessionSynonymSearch.def_auth_request(Method.GET, Format.JSON, ('filters',))
def search_accession_synonyms(request):
    """
    Quick search for an accession synonym with a exact or partial name.

    filters :
        - method : name filter method : 'ieq', 'icontains'
        - fields : requested field : 'name', 'type'
        - name : value for name field
    """
    filters = json.loads(request.GET['filters'])

    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = request.GET.get('cursor')
    limit = results_per_page

    if cursor:
        cursor_name, cursor_id = cursor.rsplit('/', 1)

        qs = AccessionSynonym.objects.filter(Q(name__gt=cursor_name) | (
            Q(name=cursor_name) & Q(id__gt=cursor_id)))
    else:
        qs = AccessionSynonym.objects.all()

    if 'name' in filters['fields']:
        name_method = filters.get('method', 'ieq')

        if name_method == 'ieq':
            qs = qs.filter(name__iexact=filters['name'])
        elif name_method == 'icontains':
            qs = qs.filter(name__icontains=filters['name'])

    if 'synonym_type' in filters['fields']:
        st_method = filters.get('synonym_type_method', 'eq')

        if st_method == 'eq':
            qs = qs.filter(synonym_type_id=filters['synonym_type'])
        # elif st_method == 'in':
        #     qs = qs.filter(synonym_type_id__in=filters['synonym_type'])

    if 'language' in filters['fields']:
        method = filters.get('language_method', 'eq')

        if method == 'eq':
            qs = qs.filter(language=filters['language'])
        elif method == 'neq':
            qs = qs.exclude(language=filters['language'])

    qs = qs.order_by('name', 'id')[:limit]

    items_list = []

    for synonym in qs:
        s = {
            'id': synonym.id,
            'value': synonym.id,
            'label': synonym.name,
            'synonym_type': synonym.synonym_type_id,
            'accession': synonym.entity_id
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


@RestAccessionIdSynonym.def_auth_request(
    Method.POST, Format.JSON, content={
        "type": "object",
        "properties": {
            "synonym_type": {"type": "number"},
            "language": AccessionSynonym.LANGUAGE_VALIDATOR,
            "name": AccessionSynonym.NAME_VALIDATOR
        },
    },
    perms={
        'accession.change_accession': _("You are not allowed to modify an accession"),
        'accession.add_accessionsynonym': _("You are not allowed to add a synonym of accession"),
    }
)
def accession_add_synonym(request, acc_id):
    accession = get_object_or_404(Accession, id=int(acc_id))

    # check that type is in the values of descriptor
    synonym_type = get_object_or_404(EntitySynonymType, id=int_arg(request.data['synonym_type']))

    entity_synonym = AccessionSynonym.add_entity_synonym(
        accession, synonym_type, request.data['name'], request.data['language'])

    result = {
        'id': entity_synonym.pk,
        'synonym_type': entity_synonym.synonym_type_id,
        'name': entity_synonym.name,
        'language': entity_synonym.language
    }

    return HttpResponseRest(request, result)


@RestAccessionIdSynonymId.def_auth_request(
    Method.PUT, Format.JSON, content={
        "type": "object",
        "properties": {
            "name": AccessionSynonym.NAME_VALIDATOR
        },
    },
    perms={
        'accession.change_accession': _("You are not allowed to modify an accession"),
        'accession.change_accessionsynonym': _("You are not allowed to modify a synonym of accession"),
    }
)
def accession_change_synonym(request, acc_id, syn_id):
    accession = get_object_or_404(Accession, id=int(acc_id))
    accession_synonym = accession.synonyms.get(id=int(syn_id))

    name = request.data['name']

    # no changes
    if name == accession_synonym.name:
        return HttpResponseRest(request, {})

    AccessionSynonym.rename(accession, accession_synonym, name)

    result = {
        'id': accession_synonym.id,
        'name:': name
    }

    return HttpResponseRest(request, result)


@RestAccessionIdSynonymId.def_auth_request(
    Method.DELETE, Format.JSON,
    perms={
        'accession.change_accession': _("You are not allowed to modify an accession"),
        'accession.delete_accessionsynonym': _("You are not allowed to delete a synonym of accession"),
    }
)
def accession_remove_synonym(request, acc_id, syn_id):
    accession = get_object_or_404(Accession, id=int(acc_id))
    synonym = accession.synonyms.get(id=int(syn_id))

    if synonym.is_code():
        raise SuspiciousOperation(_("It is not possible to remove a GRC code name"))

    if synonym.is_primary():
        raise SuspiciousOperation(_("It is not possible to remove a primary name"))

    synonym.delete()

    return HttpResponseRest(request, {})
