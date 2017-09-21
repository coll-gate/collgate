# -*- coding: utf-8; -*-
#
# @file classificationentrysynonym.py
# @brief Views related to the classification entry synonym model.
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2016-09-01
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

from django.core.exceptions import SuspiciousOperation
from django.db import IntegrityError
from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.views.decorators.cache import cache_page
from django.utils.translation import ugettext_lazy as _

from classification import localsettings
from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest

from main.models import EntitySynonymType

from .models import ClassificationEntrySynonym, ClassificationEntry

from .base import RestClassification
from .classificationentry import RestClassificationEntry, RestClassificationEntryId


class RestClassificationEntrySynonym(RestClassificationEntry):
    regex = r'^synonym/$'
    suffix = 'synonym'


class RestClassificationEntrySynonymSearch(RestClassificationEntrySynonym):
    regex = r'^search/$'
    suffix = 'search'


class RestClassificationEntryIdSynonym(RestClassificationEntryId):
    regex = r'^synonym/$'
    suffix = 'synonym'


class RestClassificationEntryIdSynonymId(RestClassificationEntryIdSynonym):
    regex = r'^(?P<syn_id>[0-9]+)/$'
    suffix = 'id'


@RestClassificationEntrySynonymSearch.def_auth_request(Method.GET, Format.JSON, ('filters',))
def search_taxon_synonym(request):
    """
    Quick search for a classification entry synonym with a exact or partial name.
    """
    filters = json.loads(request.GET['filters'])

    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = request.GET.get('cursor')
    limit = results_per_page

    if cursor:
        cursor_name, cursor_id = cursor.rsplit('/', 1)
        qs = ClassificationEntrySynonym.objects.filter(Q(name__gt=cursor_name) | (
            Q(name=cursor_name) & Q(id__gt=cursor_id)))
    else:
        qs = ClassificationEntrySynonym.objects.all()

    if 'name' in filters['fields']:
        name_method = filters.get('method', 'ieq')

        if name_method == 'ieq':
            qs = qs.filter(name__iexact=filters['name'])
        elif name_method == 'icontains':
            qs = qs.filter(name__icontains=filters['name'])

    qs = qs.order_by('name', 'id')[:limit]

    items_list = []

    for synonym in qs:
        s = {
            'id': synonym.id,
            'value': synonym.id,
            'label': synonym.name,
            'synonym_type': synonym.synonym_type_id,
            'classification_entry': synonym.entity_id
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


@RestClassificationEntryIdSynonym.def_auth_request(
    Method.POST, Format.JSON, content={
        "type": "object",
        "properties": {
            "synonym_type": {"type:": "number"},
            "language": ClassificationEntrySynonym.LANGUAGE_VALIDATOR,
            "name": ClassificationEntrySynonym.NAME_VALIDATOR
        },
    },
    perms={
        'classification.change_classificationentry': _("You are not allowed to modify a classification entry"),
        'classification.add_classificationentrysynonym': _("You are not allowed to add a synonym to a classification entry"),
    }
)
def classification_entry_add_synonym(request, cls_id):
    classification_entry = get_object_or_404(ClassificationEntry, id=int(cls_id))

    # check that type is in the values of descriptor
    synonym_type = get_object_or_404(EntitySynonymType, id=int_arg(request.data['synonym_type']))

    # check if a similar synonyms exists into the classification entry
    # or as primary name for another classification entry
    synonyms = ClassificationEntrySynonym.objects.filter(name__iexact=request.data['name'])

    # @todo unique / has_language

    for synonym in synonyms:
        # at least one usage, not compatible with primary synonym
        if synonym_type.pk == localsettings.synonym_type_classification_entry_name:
            raise SuspiciousOperation(
                _("The primary name could not be used by another synonym of classification entry"))

        # already used by another classification entry as primary name
        if synonym.is_primary():
            raise SuspiciousOperation(_("Synonym already used as a primary name"))

        # already used by this classification entry
        if synonym.entity_id == int(cls_id):
            raise SuspiciousOperation(_("Synonym already used into this classification entry"))

    classification_entry_synonym = ClassificationEntrySynonym(
        entity=classification_entry,
        name=request.data['name'],
        language=request.data['language'],
        synonym_type=synonym_type)

    classification_entry_synonym.save()
    classification_entry.synonyms.add(classification_entry_synonym)

    result = {
        'id': classification_entry_synonym.pk,
        'synonym_type': int(request.data['synonym_type']),
        'name': request.data['name'],
        'language': request.data['language']
    }

    return HttpResponseRest(request, result)


@RestClassificationEntryIdSynonymId.def_auth_request(
    Method.PUT, Format.JSON, content={
        "type": "object",
        "properties": {
            "name": ClassificationEntrySynonym.NAME_VALIDATOR
        },
    },
    perms={
        'classification.change_classificationentry': _("You are not allowed to modify a classification entry"),
        'classification.change_classificationentrysynonym':
            _("You are not allowed to modify a synonym to a classification entry"),
    }
)
def classification_entry_change_synonym(request, cls_id, syn_id):
    classification_entry = get_object_or_404(ClassificationEntry, id=int(cls_id))
    classification_entry_synonym = classification_entry.synonyms.get(id=int(syn_id))

    name = request.data['name']

    # no changes
    if name == classification_entry_synonym.name:
        return HttpResponseRest(request, {})

    # check if a similar synonyms exists into the classification entry or as primary name for another one
    synonyms = ClassificationEntrySynonym.objects.filter(name__iexact=name).exclude(id=int(syn_id))

    for synonym in synonyms:
        # at least one usage, not compatible with primary synonym
        if classification_entry_synonym.synonym_type == localsettings.synonym_type_classification_entry_name:
            raise SuspiciousOperation(
                _("The primary name could not be used by another synonym of classification entry"))

        # already used by another classification entry as primary name
        if synonym.is_primary():
            raise SuspiciousOperation(_("Synonym already used as a primary name"))

        # already used by this classification entry
        if synonym.classification_id == cls_id:
            raise SuspiciousOperation(_("Synonym already used into this classification entry"))

    try:
        with transaction.atomic():
            # rename the classification entry if the synonym name is the classification entry name
            if classification_entry.name == classification_entry_synonym.name:
                classification_entry.name = name
                classification_entry.update_field('name')
                classification_entry.save()

            classification_entry_synonym.name = name
            classification_entry_synonym.update_field('name')
            classification_entry_synonym.save()

            result = {
                'id': classification_entry_synonym.id,
                'name': classification_entry_synonym.name
            }
    except IntegrityError as e:
        logger.log(repr(e))
        raise SuspiciousOperation(_("Unable to rename a synonym of a classification entry"))

    return HttpResponseRest(request, result)


@RestClassificationEntryIdSynonymId.def_auth_request(
    Method.DELETE, Format.JSON,
    perms={
        'classification.change_classificationentry': _("You are not allowed to modify a classification entry"),
        'classification.delete_classificationentrysynonym':
            _("You are not allowed to delete a synonym from a classification entry"),
    }
)
def classification_entry_remove_synonym(request, cls_id, syn_id):
    synonym = get_object_or_404(ClassificationEntrySynonym, Q(id=int(syn_id)), Q(entity=int(cls_id)))

    if synonym.synonym_type_id == localsettings.synonym_type_classification_entry_name:
        raise SuspiciousOperation(_("It is not possible to remove a primary synonym"))

    synonym.delete()

    return HttpResponseRest(request, {})
