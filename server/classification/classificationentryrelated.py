# -*- coding: utf-8; -*-
#
# @file classificationentryrelated
# @brief collgate related classification entry REST handlers.
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2017-10-16
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import SuspiciousOperation
from django.db import IntegrityError
from django.db import transaction
from django.db.models import Prefetch
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils.translation import ugettext_lazy as _

from classification import localsettings
from classification.classification import RestClassificationClassificationId
from descriptor.describable import DescriptorsBuilder
from descriptor.models import DescriptorMetaModel, DescriptorModelType
from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest
from main.cursor import CursorQuery
from main.models import Language
from .classificationentry import RestClassificationEntryId
from .controller import ClassificationEntryManager
from .models import ClassificationEntry
from .models import ClassificationEntrySynonym


class RestClassificationEntryIdRelated(RestClassificationEntryId):
    regex = r'^related/$'
    suffix = 'related'


class RestClassificationEntryIdRelatedCount(RestClassificationEntryIdRelated):
    regex = r'^count/$'
    suffix = 'count'


@RestClassificationEntryIdRelated.def_auth_request(Method.GET, Format.JSON, perms={
    # 'classification.get_classificationentry': _("You are not allowed to get classifications entries")
})
def get_classification_entry_related(request, cls_id):
    """
    Return the list of related classification entries for the given classification entry.
    """
    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = json.loads(request.GET.get('cursor', 'null'))
    limit = results_per_page
    sort_by = json.loads(request.GET.get('sort_by', '[]'))

    if not len(sort_by) or sort_by[-1] not in ('id', '+id', '-id'):
        order_by = sort_by + ['id']
    else:
        order_by = sort_by

    classification_entry = get_object_or_404(ClassificationEntry, id=int(cls_id))

    from main.cursor import CursorQuery
    cq = CursorQuery(ClassificationEntry)

    cq.inner_join(
        ClassificationEntry,
        related_name='related',
        to_related_name='to_classificationentry',
        from_classificationentry=classification_entry.pk)

    if request.GET.get('search'):
        cq.filter(json.loads(request.GET['search']))

    if request.GET.get('filters'):
        cq.filter(json.loads(request.GET['filters']))

    cq.prefetch_related(Prefetch(
            "synonyms",
            queryset=ClassificationEntrySynonym.objects.all().order_by('synonym_type', 'language')))

    cq.select_related('parent->name', 'parent->rank')

    cq.cursor(cursor, order_by)
    cq.order_by(order_by).limit(limit)

    classification_items = []

    for classification in cq:
        c = {
            'id': classification.id,
            'name': classification.name,
            'parent': classification.parent_id,
            'rank': classification.rank_id,
            'descriptor_meta_model': classification.descriptor_meta_model_id,
            'descriptors': classification.descriptors,
            'parent_list': classification.parent_list,
            # 'parent_details': None,
            'synonyms': []
        }

        # if classification.parent:
        #     c['parent_details'] = {
        #         'id': classification.parent.id,
        #         'name': classification.parent.name,
        #         'rank': classification.parent.rank_id
        #     }

        for synonym in classification.synonyms.all():
            c['synonyms'].append({
                'id': synonym.id,
                'name': synonym.name,
                'synonym_type': synonym.synonym_type_id,
                'language': synonym.language
            })

        classification_items.append(c)

    results = {
        'perms': [],
        'items': classification_items,
        'prev': cq.prev_cursor,
        'cursor': cursor,
        'next': cq.next_cursor,
    }

    return HttpResponseRest(request, results)


@RestClassificationEntryIdRelatedCount.def_auth_request(Method.GET, Format.JSON, perms={
    # 'classification.get_classificationentry': _("You are not allowed to get classifications entries")
})
def get_count_classification_entry_related(request, cls_id):
    """
    Return the list of related classification entries for the given classification entry.
    """
    classification_entry = get_object_or_404(ClassificationEntry, id=int(cls_id))

    from main.cursor import CursorQuery
    cq = CursorQuery(ClassificationEntry)

    cq.inner_join(
        ClassificationEntry,
        related_name='related',
        to_related_name='to_classificationentry',
        from_classificationentry=classification_entry.pk)

    if request.GET.get('search'):
        cq.filter(json.loads(request.GET['search']))

    if request.GET.get('filters'):
        cq.filter(json.loads(request.GET['filters']))

    count = cq.count()

    results = {
        'count': count
    }

    return HttpResponseRest(request, results)
