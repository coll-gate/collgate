# -*- coding: utf-8; -*-
#
# @file actionaccession
# @brief collgate 
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2018-04-16
# @copyright Copyright (c) 2018 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details

import json

from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import SuspiciousOperation, PermissionDenied
from django.db.models import Prefetch
from django.shortcuts import get_object_or_404
from django.utils.translation import ugettext_lazy as _

from accession.models import Accession, AccessionSynonym, Action, ActionData, ActionDataType, AccessionPanel
from igdectk.rest.response import HttpResponseRest
from main.models import EntitySynonymType

from .action import RestActionIdStepIdx

from igdectk.common.helpers import int_arg
from igdectk.rest import Method, Format
from igdectk.rest.response import HttpResponseRest


class RestActionIdStepIdxAccession(RestActionIdStepIdx):
    regex = r'^accession/$'
    suffix = 'accession'


class RestActionIdStepIdxAccessionCount(RestActionIdStepIdx):
    regex = r'^accession/count/$'
    suffix = 'accession/count/'


class RestActionIdStepIdxData(RestActionIdStepIdx):
    regex = r'^data/$'
    suffix = 'data'


class RestActionIdStepIdxDataAccession(RestActionIdStepIdxData):
    regex = r'^accession/$'
    suffix = 'accession'


class RestActionIdStepIdxDataAccessionCount(RestActionIdStepIdxData):
    regex = r'^accession/count/$'
    suffix = 'accession/count/'


@RestActionIdStepIdxAccessionCount.def_auth_request(Method.GET, Format.JSON, perms={
    'accession.get_action': _("You are not allowed to get an action"),
    'accession.list_accession': _("You are not allowed to list the accessions")
})
def get_action_id_step_idx_accession_list_count(request, act_id, step_idx):
    # action = get_object_or_404(Action, pk=int(act_id))
    # @todo check permission on the action

    from main.cursor import CursorQuery
    cq = CursorQuery(Accession)

    if request.GET.get('search'):
        search = json.loads(request.GET['search'])
        cq.filter(search)

    if request.GET.get('filters'):
        filters = json.loads(request.GET['filters'])
        cq.filter(filters)

    # working accession panel
    cq.m2m_to_array_field(
        relationship=AccessionPanel.accessions,
        selected_field='accessionpanel_id',
        from_related_field='id',
        to_related_field='accession_id',
        alias='panels'
    )

    cq.m2m_to_array_field(
        relationship=Accession.classifications_entries,
        selected_field='classification_entry_id',
        from_related_field='id',
        to_related_field='accession_id',
        alias='classifications'
    )

    cq.set_synonym_model(AccessionSynonym)

    results = {
        'count': cq.count()
    }

    return HttpResponseRest(request, results)


@RestActionIdStepIdxAccession.def_auth_request(Method.GET, Format.JSON, perms={
    'accession.get_action': _("You are not allowed to get an action"),
    'accession.list_accession': _("You are not allowed to list the accessions")
})
def get_action_id_step_idx_accession_list(request, act_id, step_idx):
    action = get_object_or_404(Action, pk=int(act_id))
    # @todo check permission on the action

    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = json.loads(request.GET.get('cursor', 'null'))
    limit = results_per_page
    sort_by = json.loads(request.GET.get('sort_by', '[]'))

    if not len(sort_by) or sort_by[-1] not in ('id', '+id', '-id'):
        order_by = sort_by + ['id']
    else:
        order_by = sort_by

    from main.cursor import CursorQuery
    cq = CursorQuery(Accession)

    if request.GET.get('search'):
        search = json.loads(request.GET['search'])
        cq.filter(search)

    if request.GET.get('filters'):
        filters = json.loads(request.GET['filters'])
        cq.filter(filters)

    # working accession panel
    cq.m2m_to_array_field(
        relationship=AccessionPanel.accessions,
        selected_field='accessionpanel_id',
        from_related_field='id',
        to_related_field='accession_id',
        alias='panels'
    )

    cq.m2m_to_array_field(
        relationship=Accession.classifications_entries,
        selected_field='classification_entry_id',
        from_related_field='id',
        to_related_field='accession_id',
        alias='classifications'
    )

    cq.set_synonym_model(AccessionSynonym)

    cq.prefetch_related(Prefetch("synonyms", queryset=AccessionSynonym.objects.all().order_by(
        'synonym_type', 'language')))

    cq.select_related('primary_classification_entry->name', 'primary_classification_entry->rank')

    cq.cursor(cursor, order_by)
    cq.inner_join(AccessionPanel, accessionpanel=int(panel_id))
    cq.order_by(order_by).limit(limit)

    accession_items = []

    synonym_types = dict(
        EntitySynonymType.objects.filter(
            target_model=ContentType.objects.get_for_model(Accession)).values_list('id', 'name'))

    for accession in cq:
        a = {
            'id': accession.pk,
            'name': accession.name,
            'code': accession.code,
            'primary_classification_entry': accession.primary_classification_entry_id,
            'layout': accession.layout_id,
            'descriptors': accession.descriptors,
            'synonyms': {},
            'primary_classification_entry_details': {
                'id': accession.primary_classification_entry_id,
                'name': accession.primary_classification_entry_name,
                'rank': accession.primary_classification_entry_rank_id,
            }
        }

        for synonym in accession.synonyms.all():
            synonym_type_name = synonym_types.get(synonym.synonym_type_id)
            a['synonyms'][synonym_type_name] = {
                'id': synonym.id,
                'name': synonym.name,
                'synonym_type': synonym.synonym_type_id,
                'language': synonym.language
            }

        accession_items.append(a)

    results = {
        'perms': [],
        'items': accession_items,
        'prev': cq.prev_cursor,
        'cursor': cursor,
        'next': cq.next_cursor,
    }

    return HttpResponseRest(request, results)


@RestActionIdStepIdxDataAccessionCount.def_auth_request(Method.GET, Format.JSON, perms={
    'accession.get_action': _("You are not allowed to get an action"),
    'accession.list_accession': _("You are not allowed to list the accessions")
})
def get_action_id_step_idx_accession_list_count(request, act_id, step_idx):
    action = get_object_or_404(Action, pk=int(act_id))
    # @todo check permission on the action

    # any elements of the array are returned
    # in_action_data = get_object_or_404(ActionData, action=action, step_index=step_idx, type=ActionDataType.INPUT.value)
    # out_action_data = get_object_or_404(ActionData, action=action, step_index=step_idx, type=ActionDataType.OUTPUT.value)

    from main.cursor import CursorQuery
    cq = CursorQuery(Accession)

    if request.GET.get('search'):
        search = json.loads(request.GET['search'])
        cq.filter(search)

    if request.GET.get('filters'):
        filters = json.loads(request.GET['filters'])
        cq.filter(filters)

    # working accession panel
    cq.m2m_to_array_field(
        relationship=AccessionPanel.accessions,
        selected_field='accessionpanel_id',
        from_related_field='id',
        to_related_field='accession_id',
        alias='panels'
    )

    cq.m2m_to_array_field(
        relationship=Accession.classifications_entries,
        selected_field='classification_entry_id',
        from_related_field='id',
        to_related_field='accession_id',
        alias='classifications'
    )

    cq.set_synonym_model(AccessionSynonym)

    results = {
        'count': cq.count()
    }

    return HttpResponseRest(request, results)


@RestActionIdStepIdxDataAccession.def_auth_request(Method.GET, Format.JSON, perms={
    'accession.get_action': _("You are not allowed to get an action"),
    'accession.list_accession': _("You are not allowed to list the accessions")
})
def get_action_id_step_idx_accession_list(request, act_id, step_idx):
    action = get_object_or_404(Action, pk=int(act_id))
    # @todo check permission on the action

    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = json.loads(request.GET.get('cursor', 'null'))
    limit = results_per_page
    sort_by = json.loads(request.GET.get('sort_by', '[]'))

    if not len(sort_by) or sort_by[-1] not in ('id', '+id', '-id'):
        order_by = sort_by + ['id']
    else:
        order_by = sort_by

    from main.cursor import CursorQuery
    cq = CursorQuery(Accession)

    if request.GET.get('search'):
        search = json.loads(request.GET['search'])
        cq.filter(search)

    if request.GET.get('filters'):
        filters = json.loads(request.GET['filters'])
        cq.filter(filters)

    # working accession panel
    cq.m2m_to_array_field(
        relationship=AccessionPanel.accessions,
        selected_field='accessionpanel_id',
        from_related_field='id',
        to_related_field='accession_id',
        alias='panels'
    )

    cq.m2m_to_array_field(
        relationship=Accession.classifications_entries,
        selected_field='classification_entry_id',
        from_related_field='id',
        to_related_field='accession_id',
        alias='classifications'
    )

    cq.set_synonym_model(AccessionSynonym)

    cq.prefetch_related(Prefetch("synonyms", queryset=AccessionSynonym.objects.all().order_by(
        'synonym_type', 'language')))

    cq.select_related('primary_classification_entry->name', 'primary_classification_entry->rank')

    cq.cursor(cursor, order_by)
    cq.order_by(order_by).limit(limit)

    accession_items = []

    synonym_types = dict(
        EntitySynonymType.objects.filter(
            target_model=ContentType.objects.get_for_model(Accession)).values_list('id', 'name'))

    for accession in cq:
        a = {
            'id': accession.pk,
            'name': accession.name,
            'code': accession.code,
            'primary_classification_entry': accession.primary_classification_entry_id,
            'layout': accession.layout_id,
            'descriptors': accession.descriptors,
            'synonyms': {},
            'primary_classification_entry_details': {
                'id': accession.primary_classification_entry_id,
                'name': accession.primary_classification_entry_name,
                'rank': accession.primary_classification_entry_rank_id,
            }
        }

        for synonym in accession.synonyms.all():
            synonym_type_name = synonym_types.get(synonym.synonym_type_id)
            a['synonyms'][synonym_type_name] = {
                'id': synonym.id,
                'name': synonym.name,
                'synonym_type': synonym.synonym_type_id,
                'language': synonym.language
            }

        accession_items.append(a)

    results = {
        'perms': [],
        'items': accession_items,
        'prev': cq.prev_cursor,
        'cursor': cursor,
        'next': cq.next_cursor,
    }

    return HttpResponseRest(request, results)
