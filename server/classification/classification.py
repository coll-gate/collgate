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


class RestClassificationClassificationIdRankId(RestClassificationClassificationIdRank):
    regex = r'^(?P<ran_id>[0-9]+)/$'
    suffix = 'id'


class RestClassificationClassificationRank(RestClassification):
    regex = r'^classificationrank/$'
    suffix = 'classificationrank'


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

    classification_items = []

    for classification in cq:
        c = {
            'id': classification.id,
            'name': classification.name,
            'can_modify': classification.can_modify,
            'can_delete': classification.can_delete,
            'label': classification.get_label(),
            'description': classification.description,
            'num_classification_ranks': classification.ranks.all().count()
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

    if request.GET.get('filters'):
        filters = json.loads(request.GET['filters'])
        cq.filter(filters)

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
    filters = json.loads(request.GET['filters'])
    page = int_arg(request.GET.get('page', 1))

    classifications = None

    if filters['method'] == 'ieq' and 'name' in filters['fields']:
        classifications = Classification.objects.filter(name__iexact=filters['name'])
    elif filters['method'] == 'icontains' and 'name' in filters['fields']:
        classifications = Classification.objects.filter(name__icontains=filters['name'])

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
                'num_classification_ranks': classification.ranks.all().count()
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
        'label': classification.get_label()
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
            "label": Classification.LABEL_VALIDATOR_OPTIONAL
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

    classification = get_object_or_404(Classification, id=int(cls_id))

    result = {
        'id': classification.id
    }

    if name is not None:
        if name != classification.name and Classification.objects.filter(name=name).exists():
            raise SuspiciousOperation(_("The name of classification already exists"))

        classification.update_field('name')
        classification.name = name

        result['name'] = classification.name

    if label is not None:
        lang = translation.get_language()

        classification.update_field('label')
        classification.set_label(lang, label)

        result['label'] = classification.get_label()

    classification.save()

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
def change_all_labels_of_descriptor_model_type(request, cls_id):
    """
    Changes all the label, for each language related to the user interface.
    Returns only the local label.
    """
    classification = get_object_or_404(Classification, id=int(cls_id))

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


# @todo change to def_auth_request after dynamic on client side
@RestClassificationClassificationIdRank.def_request(Method.GET, Format.JSON)
def get_classification_classification_rank_list(request, cls_id):
    """
    Get a list of classification rank in JSON
    """
    classification = get_object_or_404(Classification, id=int(cls_id))

    ranks = []
    for rank in classification.ranks.all().order_by('level'):
        ranks.append({
            'id': rank.id,
            'name': rank.name,
            'label': rank.get_label(),
            'level': rank.level
        })

    return HttpResponseRest(request, ranks)

# @todo POST, PUT, PATCH, DELETE classification rank


@RestClassificationClassificationRank.def_request(Method.GET, Format.JSON, ('filters',))
def get_classification_rank_list(request):
    """
    Get a list of classification rank in JSON
    """
    selection = json.loads(request.GET.get('filters', {}))[0]['value']
    # @todo selection must be array or use Cursor without limit/order/cursor

    classification_ranks = ClassificationRank.objects.filter(id__in=selection)

    classification_ranks_items = {}
    for classification_rank in classification_ranks:
        classification_ranks_items[classification_rank.id] = {
            'id': classification_rank.id,
            'name': classification_rank.name,
            'label': classification_rank.get_label(),
            'level': classification_rank.level
        }

    # @todo manage validity (short duration)
    results = {
        'cacheable': True,
        'validity': None,
        'items': classification_ranks_items
    }

    return HttpResponseRest(request, results)
