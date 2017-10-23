# -*- coding: utf-8; -*-
#
# @file classification.py
# @brief coll-gate classification rest handlers
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2017-08-31
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details

from django.core.exceptions import SuspiciousOperation
from django.db import transaction
from django.db.models import Count
from django.shortcuts import get_object_or_404
from django.utils import translation
from django.utils.translation import ugettext_lazy as _

from classification.models import Classification, ClassificationRank
from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest

from classification.base import RestClassification
from main.cursor import CursorQuery
from main.models import Language, InterfaceLanguages


class RestClassificationClassification(RestClassification):
    regex = r'^classification/$'
    suffix = 'classification'


class RestClassificationClassificationCount(RestClassificationClassification):
    regex = r'^count/$'
    suffix = 'count'


class RestClassificationClassificationSearch(RestClassificationClassification):
    regex = r'^search/$'
    suffix = 'search'


class RestClassificationClassificationId(RestClassificationClassification):
    regex = r'^(?P<cls_id>[0-9]+)/$'
    suffix = 'id'


class RestClassificationClassificationIdLabel(RestClassificationClassificationId):
    regex = r'^label/$'
    suffix = 'label'


class RestClassificationClassificationIdRank(RestClassificationClassificationId):
    regex = r'^classificationrank/$'
    suffix = 'classificationrank'


# class RestClassificationClassificationIdRankCount(RestClassificationClassificationIdRank):
#     regex = r'^count/$'
#     suffix = 'count'


class RestClassificationClassificationRank(RestClassification):
    regex = r'^classificationrank/$'
    suffix = 'classificationrank'


class RestClassificationClassificationRankSearch(RestClassificationClassificationRank):
    regex = r'^search/$'
    suffix = 'search'


class RestClassificationClassificationRankId(RestClassificationClassificationRank):
    regex = r'^(?P<crk_id>[0-9]+)/$'
    suffix = 'id'


class RestClassificationClassificationRankIdLabel(RestClassificationClassificationRankId):
    regex = r'^label/$'
    suffix = 'label'


@RestClassificationClassification.def_auth_request(Method.GET, Format.JSON)
def get_classification_list(request):
    """
    Get the list of classification in JSON
    """
    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = json.loads(request.GET.get('cursor', 'null'))
    limit = results_per_page
    sort_by = json.loads(request.GET.get('sort_by', '["name"]'))
    order_by = sort_by

    cq = CursorQuery(Classification)

    if request.GET.get('search'):
        search = json.loads(request.GET['search'])
        cq.filter(search)

    if request.GET.get('filters'):
        filters = json.loads(request.GET['filters'])
        cq.filter(filters)

    cq.cursor(cursor, order_by)
    cq.order_by(order_by).limit(limit)
    cq.set_count('ranks')

    classification_items = []

    for classification in cq:
        c = {
            'id': classification.id,
            'name': classification.name,
            'can_modify': classification.can_modify,
            'can_delete': classification.can_delete,
            'label': classification.get_label(),
            'description': classification.description,
            'num_classification_ranks': classification.ranks__count
        }

        classification_items.append(c)

    results = {
        'perms': [],
        'items': classification_items,
        'prev': cq.prev_cursor,
        'cursor': cursor,
        'next': cq.next_cursor
    }

    return HttpResponseRest(request, results)


@RestClassificationClassificationCount.def_auth_request(Method.GET, Format.JSON)
def get_classification_list_count(request):
    """
    Get the count of number of classifications in JSON
    """
    cq = CursorQuery(Classification)

    if request.GET.get('search'):
        cq.filter(json.loads(request.GET['search']))

    if request.GET.get('filters'):
        cq.filter(json.loads(request.GET['filters']))

    results = {
        'perms': [],
        'count': cq.count()
    }

    return HttpResponseRest(request, results)


@RestClassificationClassificationSearch.def_auth_request(Method.GET, Format.JSON, ('filters',), staff=True)
def search_classification(request):
    """
    Filters the classification by name.
    """
    filters = json.loads(request.GET.get('filters', {}))
    fields = filters.get('fields', [])
    page = int_arg(request.GET.get('page', 1))

    classifications = Classification.objects.get_queryset()

    if 'name' in fields:
        method = filters.get('method', 'ieq')

        if method == 'ieq':
            classifications = classifications.filter(name__iexact=filters['name'])
        elif method == 'icontains':
            classifications = classifications.filter(name__icontains=filters['name'])

    classifications = classifications.annotate(Count('ranks'))
    classifications_list = []

    if classifications:
        for classification in classifications:
            classifications_list.append({
                "id": classification.id,
                "name": classification.name,
                'can_modify': classification.can_modify,
                'can_delete': classification.can_delete,
                'label': classification.get_label(),
                'description': classification.description,
                'num_classification_ranks': classification.ranks__count
            })

    response = {
        'items': classifications_list,
        'page': page
    }

    return HttpResponseRest(request, response)


@RestClassificationClassificationId.def_auth_request(Method.GET, Format.JSON)
def get_classification_details(request, cls_id):
    """
    Get the details of a classification
    """
    classification = get_object_or_404(Classification, id=int(cls_id))

    results = {
        'id': classification.id,
        'name': classification.name,
        'label': classification.get_label(),
        'can_modify': classification.can_modify,
        'can_delete': classification.can_delete,
        'num_classification_ranks': classification.ranks.all().count()
    }

    return HttpResponseRest(request, results)


@RestClassificationClassification.def_auth_request(Method.POST, Format.JSON, content={
        "type": "object",
        "properties": {
            "name": Classification.NAME_VALIDATOR,
            "label": Classification.LABEL_VALIDATOR,
            "description": {"type": "string", 'maxLength': 1024, "required": False, "blank": True}
        },
    },
    perms={'classification.add_classification': _('You are not allowed to create a classification')},
    staff=True)
def create_classification(request):
    """
    Create a new classification with a label in the current language.
    """
    parameters = request.data

    language = translation.get_language()

    if not Language.objects.filter(code=language).exists():
        raise SuspiciousOperation(_("The language is not supported"))

    if Classification.objects.filter(name=parameters['name']).exists():
        raise SuspiciousOperation(_("A classification already exists with this name"))

    classification = Classification()

    classification.name = parameters['name']
    classification.set_label(language, parameters['label'])
    classification.description = parameters['description']

    classification.save()

    response = {
        'id': classification.pk,
        'name': classification.name,
        'can_modify': classification.can_modify,
        'can_delete': classification.can_delete,
        'label': classification.get_label(),
        'description': classification.description,
        'num_classification_ranks': 0
    }

    return HttpResponseRest(request, response)


@RestClassificationClassificationId.def_auth_request(Method.PATCH, Format.JSON, content={
        "type": "object",
        "properties": {
            "name": Classification.NAME_VALIDATOR_OPTIONAL,
            "label": Classification.LABEL_VALIDATOR_OPTIONAL,
            "levels": {"type": "array", 'items': [], 'additionalItems': {
                "type": "object",
                "minItems": 0,
                "maxItems": 200,
                "properties": {
                    "id": {"type": "number"},
                    "level": {"type": "number"}
                }
            }}
        },
    },
    perms={'classification.change_classification': _('You are not allowed to modify a classification')},
    staff=True)
def patch_classification(request, cls_id):
    """
    Change the 'name' or 'label' of a classification.
    """
    name = request.data.get('name')
    label = request.data.get('label')
    levels = request.data.get('levels')

    update = False

    classification = get_object_or_404(Classification, id=int(cls_id))

    if not classification.can_modify:
        raise SuspiciousOperation(_("This classification is locked"))

    result = {
        'id': classification.id
    }

    if name is not None:
        if name != classification.name and Classification.objects.filter(name=name).exists():
            raise SuspiciousOperation(_("The name of classification already exists"))

        classification.update_field('name')
        classification.name = name

        update = True
        result['name'] = classification.name

    if label is not None:
        lang = translation.get_language()

        classification.update_field('label')
        classification.set_label(lang, label)

        update = True
        result['label'] = classification.get_label()

    if update:
        classification.save()

    if levels is not None:
        with transaction.atomic():
            ranks = classification.ranks.filter(id__in=[x['id'] for x in levels])

            # could use a set constraints level DEFERRED; but how with django and non raw ?
            # fake with a minus level temporary
            for level in levels:
                for rank in ranks:
                    if rank.id == level['id']:
                        rank.level = -level['level']
                        rank.save()
                        break

            for level in levels:
                for rank in ranks:
                    if rank.id == level['id']:
                        rank.level = level['level']
                        rank.save()
                        break

    return HttpResponseRest(request, result)


@RestClassificationClassificationId.def_auth_request(Method.DELETE, Format.JSON, perms={
    'classification.delete_classification': _('You are not allowed to remove a classification')},
    staff=True)
def delete_classification(request, cls_id):
    """
    If possible delete a classification.
    It is not possible if there is data using the classification or the status is valid.
    """
    classification = get_object_or_404(Classification, id=int(cls_id))

    if not classification.can_delete:
        raise SuspiciousOperation(_("This classification is locked"))

    if classification.in_usage():
        raise SuspiciousOperation(_("There is some ranks into this classification"))

    classification.delete()

    return HttpResponseRest(request, {})


@RestClassificationClassificationIdLabel.def_auth_request(Method.GET, Format.JSON)
def get_all_labels_of_classification(request, cls_id):
    """
    Returns labels for each language related to the user interface.
    """
    classification = get_object_or_404(Classification, id=int(cls_id))

    label_dict = classification.label

    # complete with missing languages
    for lang, lang_label in InterfaceLanguages.choices():
        if lang not in label_dict:
            label_dict[lang] = ""

    results = label_dict

    return HttpResponseRest(request, results)


@RestClassificationClassificationIdLabel.def_auth_request(
    Method.PUT, Format.JSON, content={
        "type": "object",
        "additionalProperties": Classification.LABEL_VALIDATOR
    },
    perms={'classification.change_classification': _('You are not allowed to modify a classification')},
    staff=True)
def change_all_labels_of_classification(request, cls_id):
    """
    Changes all the label, for each language related to the user interface.
    Returns only the local label.
    """
    classification = get_object_or_404(Classification, id=int(cls_id))

    if not classification.can_modify:
        raise SuspiciousOperation(_("This classification is locked"))

    labels = request.data

    languages_values = [lang[0] for lang in InterfaceLanguages.choices()]

    for lang, label in labels.items():
        if lang not in languages_values:
            raise SuspiciousOperation(_("Unsupported language identifier"))

    classification.label = labels

    classification.update_field('label')
    classification.save()

    result = {
        'label': classification.get_label()
    }

    return HttpResponseRest(request, result)


@RestClassificationClassificationIdRank.def_auth_request(Method.GET, Format.JSON)
def get_classification_id_classification_rank_list(request, cls_id):
    """
    Get a list of classification rank in JSON
    """
    classification = get_object_or_404(Classification, id=int(cls_id))

    ranks = []

    for rank in classification.ranks.all().order_by('level').annotate(Count('classificationentry')):
        ranks.append({
            'id': rank.id,
            'name': rank.name,
            'label': rank.get_label(),
            'level': rank.level,
            'num_classification_entries': rank.classificationentry__count
        })

    return HttpResponseRest(request, ranks)


# @RestClassificationClassificationIdRankCount.def_auth_request(Method.GET, Format.JSON)
# def get_classification_id_classification_rank_list_count(request, cls_id):
#     """
#     Get the count of number of classifications in JSON
#     """
#     classification = get_object_or_404(Classification, id=int(cls_id))
#
#     cq = CursorQuery(Classification)
#     cq.filter({'type': 'term', 'field': 'classification_id', 'value': int(cls_id), 'op': 'eq'})
#
#     if request.GET.get('filters'):
#         filters = json.loads(request.GET['filters'])
#         cq.filter(filters)
#
#     results = {
#         'perms': [],
#         'count': cq.count()
#     }
#
#     return HttpResponseRest(request, results)


@RestClassificationClassificationRank.def_auth_request(Method.GET, Format.JSON, ('filters',))
def get_classification_rank_list(request):
    """
    Get a list of classification rank in JSON
    """
    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = json.loads(request.GET.get('cursor', 'null'))
    limit = results_per_page
    sort_by = json.loads(request.GET.get('sort_by', '["name"]'))
    order_by = sort_by

    cq = CursorQuery(Classification)

    if request.GET.get('search'):
        search = json.loads(request.GET['search'])
        cq.filter(search)

    if request.GET.get('filters'):
        filters = json.loads(request.GET['filters'])
        cq.filter(filters)

    cq.cursor(cursor, order_by)
    cq.order_by(order_by).limit(limit)

    # @todo with CursorQuery .annotate(Count('classificationentry')): to have a count for a PREFETCH
    # => COUNT("classification_classificationrank"."id") AS "ranks__count"
    classification_rank_items = []

    for classification_rank in cq:
        c = {
            'id': classification_rank.id,
            'name': classification_rank.name,
            'label': classification_rank.get_label(),
            'level': classification_rank.level,
            'num_classification_entries': classification_rank.classificationentry_set.all().count()
        }

        classification_rank_items.append(c)

    results = {
        'perms': [],
        'items': classification_rank_items,
        'prev': cq.prev_cursor,
        'cursor': cursor,
        'next': cq.next_cursor
    }

    return HttpResponseRest(request, results)


@RestClassificationClassificationRankSearch.def_auth_request(Method.GET, Format.JSON, ('filters',), staff=True)
def search_classification_rank(request):
    """
    Filters the classification rank by name.
    """
    filters = json.loads(request.GET.get('filters', {}))
    fields = filters.get('fields', [])
    page = int_arg(request.GET.get('page', 1))

    classification_ranks = ClassificationRank.objects.get_queryset()

    if 'name' in fields:
        method = filters.get('method', 'ieq')

        if method == 'ieq':
            classification_ranks = classification_ranks.filter(name__iexact=filters['name'])
        elif method == 'icontains':
            classification_ranks = classification_ranks.filter(name__icontains=filters['name'])

    classification_ranks = classification_ranks.annotate(Count('classificationentry')).order_by('level')
    classification_ranks_list = []

    if classification_ranks:
        for classification_rank in classification_ranks:
            classification_ranks_list.append({
                "id": classification_rank.id,
                "name": classification_rank.name,
                'label': classification_rank.get_label(),
                'level': classification_rank.level,
                'num_classification_entries': classification_rank.classificationentry__count
            })

    response = {
        'items': classification_ranks_list,
        'page': page
    }

    return HttpResponseRest(request, response)


@RestClassificationClassificationIdRank.def_auth_request(Method.POST, Format.JSON, content={
        "type": "object",
        "properties": {
            "name": Classification.NAME_VALIDATOR,
            "label": Classification.LABEL_VALIDATOR
        },
    },
    perms={
        'classification.modifiy_classification': _('You are not allowed to modify a classification'),
        'classification.add_classificationrank': _('You are not allowed to create a classification rank')
    }, staff=True)
def create_classification_classification_rank(request, cls_id):
    """
    Create a classification rank for a specific classification at the latest level.
    """
    parameters = request.data

    language = translation.get_language()

    if not Language.objects.filter(code=language).exists():
        raise SuspiciousOperation(_("The language is not supported"))

    classification = get_object_or_404(Classification, id=int(cls_id))

    if not classification.can_modify:
        raise SuspiciousOperation(_("This classification is locked"))

    if ClassificationRank.objects.filter(name=parameters['name']).exists():
        raise SuspiciousOperation(_("A rank of classification already exists with this name"))

    try:
        auto_level = classification.ranks.latest('level').level + 1
    except ClassificationRank.DoesNotExist:
        auto_level = 0

    classification_rank = ClassificationRank()

    classification_rank.classification = classification
    classification_rank.name = parameters['name']
    classification_rank.set_label(language, parameters['label'])
    classification_rank.level = auto_level

    classification_rank.save()

    response = {
        'id': classification_rank.pk,
        'name': classification_rank.name,
        'label': classification_rank.get_label(),
        'level': classification_rank.level,
        'num_classification_entries': 0
    }

    return HttpResponseRest(request, response)


@RestClassificationClassificationRankId.def_auth_request(Method.PATCH, Format.JSON, content={
        "type": "object",
        "properties": {
            "name": ClassificationRank.NAME_VALIDATOR_OPTIONAL,
            "label": ClassificationRank.LABEL_VALIDATOR_OPTIONAL
        },
    },
    perms={
        'classification.change_classification': _('You are not allowed to modify a classification'),
        'classification.change_classificationrank': _('You are not allowed to modify a classification rank')
    }, staff=True)
def patch_classification_rank(request, crk_id):
    """
    Change the 'name' or 'label' of a classification rank.
    """
    name = request.data.get('name')
    label = request.data.get('label')

    classification_rank = get_object_or_404(ClassificationRank, id=int(crk_id))

    if not classification_rank.classification.can_modify:
        raise PermissionDenied(_("The classification owning this rank is locked"))

    result = {
        'id': classification_rank.id
    }

    if name is not None:
        if name != classification_rank.name and ClassificationRank.objects.filter(name=name).exists():
            raise SuspiciousOperation(_("The name of classification rank already exists"))

        classification_rank.update_field('name')
        classification_rank.name = name

        result['name'] = classification_rank.name

    if label is not None:
        lang = translation.get_language()

        classification_rank.update_field('label')
        classification_rank.set_label(lang, label)

        result['label'] = classification_rank.get_label()

    classification_rank.save()

    return HttpResponseRest(request, result)


@RestClassificationClassificationRankId.def_auth_request(Method.DELETE, Format.JSON, perms={
    'classification.change_classification': _('You are not allowed to remove a classification'),
    'classification.delete_classification': _('You are not allowed to remove a classification rank')
}, staff=True)
def delete_classification_rank(request, crk_id):
    """
    If possible delete a classification rank.
    It is not possible if there is data using the classification or the status is valid.
    """
    classification_rank = get_object_or_404(ClassificationRank, id=int(crk_id))

    if not classification_rank.classification.can_modify:
        raise PermissionDenied(_("The classification owning this rank is locked"))

    if classification_rank.in_usage():
        raise SuspiciousOperation(_("There is one or more entities using this classification rank"))

    # l-shift next ranks level
    with transaction.atomic():
        ranks = classification_rank.classification.ranks.filter(level__gt=classification_rank.level).order_by('level')

        classification_rank.delete()

        # could use a set constraints level DEFERRED; but how with django and non raw ?
        # fake with a minus level temporary
        for rank in ranks:
            rank.level = rank.level - 1
            rank.save()

    return HttpResponseRest(request, {})


@RestClassificationClassificationRankIdLabel.def_auth_request(Method.GET, Format.JSON)
def get_all_labels_of_classification_rank(request, crk_id):
    """
    Returns labels for each language related to the user interface.
    """
    classification_rank = get_object_or_404(ClassificationRank, id=int(crk_id))

    label_dict = classification_rank.label

    # complete with missing languages
    for lang, lang_label in InterfaceLanguages.choices():
        if lang not in label_dict:
            label_dict[lang] = ""

    results = label_dict

    return HttpResponseRest(request, results)


@RestClassificationClassificationRankIdLabel.def_auth_request(
    Method.PUT, Format.JSON, content={
        "type": "object",
        "additionalProperties": Classification.LABEL_VALIDATOR
    },
    perms={
        'classification.change_classification': _('You are not allowed to modify a classification'),
        'classification.change_classificationrank': _('You are not allowed to modify a classification rank')
    },
    staff=True)
def change_all_labels_of_classification_rank(request, crk_id):
    """
    Changes all the label, for each language related to the user interface.
    Returns only the local label.
    """
    classification_rank = get_object_or_404(ClassificationRank, id=int(crk_id))

    if not classification_rank.classification.can_modify:
        raise PermissionDenied(_("The classification owning this rank is locked"))

    labels = request.data

    languages_values = [lang[0] for lang in InterfaceLanguages.choices()]

    for lang, label in labels.items():
        if lang not in languages_values:
            raise SuspiciousOperation(_("Unsupported language identifier"))

    classification_rank.label = labels

    classification_rank.update_field('label')
    classification_rank.save()

    result = {
        'label': classification_rank.get_label()
    }

    return HttpResponseRest(request, result)
