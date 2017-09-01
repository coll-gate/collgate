# -*- coding: utf-8; -*-
#
# @file classification.py
# @brief coll-gate classification rest handlers
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2017-08-31
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details

from django.contrib.contenttypes.models import ContentType
from django.shortcuts import get_object_or_404

from classification.models import Classification, ClassificationRank
from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest

from classification.base import RestClassification
from main.cursor import CursorQuery


class RestClassificationClassification(RestClassification):
    regex = r'^classification/$'
    suffix = 'classification'


class RestClassificationClassificationId(RestClassificationClassification):
    regex = r'^(?P<cls_id>[0-9]+)/$'
    suffix = 'id'


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
    sort_by = json.loads(request.GET.get('sort_by', '["name"]'))
    order_by = sort_by

    cq = CursorQuery(Classification)

    if request.GET.get('filters'):
        filters = json.loads(request.GET['filters'])
        cq.filter(filters)

    cq.order_by(order_by)

    classification_items = []

    for classification in cq:
        c = {
            'id': classification.id,
            'name': classification.name,
            'label': classification.get_label(),
            'num_ranks': classification.ranks.all().count()
        }

        classification_items.append(c)

    results = {
        'perms': [],
        'items': classification_items
    }

    return HttpResponseRest(request, results)


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

# @todo POST, PUT, PATCH, DELETE classification


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
