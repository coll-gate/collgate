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

from classification.models import Classification
from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest

from classification.base import RestClassification


class RestClassificationClassification(RestClassification):
    regex = r'^classification/$'
    suffix = 'classification'


class RestClassificationClassificationId(RestClassificationClassification):
    regex = r'^(?P<cls_id>[0-9]+)/$'
    suffix = 'id'


class RestClassificationClassificationIdRank(RestClassificationClassificationId):
    regex = r'^rank/$'
    suffix = 'rank'


class RestClassificationClassificationIdRankId(RestClassificationClassificationIdRank):
    regex = r'^(?P<ran_id>[0-9]+)/$'
    suffix = 'id'


@RestClassificationClassificationIdRank.def_request(Method.GET, Format.JSON)
def get_classification_rank_list(request, cls_id):
    """
    Get the list of classification rank in JSON
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

# @todo classification Rank
# @todo, create, get, list, remove, manage, classification
