# -*- coding: utf-8; -*-
#
# Copyright (c) 2017 INRA UMR1095 GDEC

"""
coll-gate accession batch rest handler
"""

from django.db.models import Q
from django.shortcuts import get_object_or_404

from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest
from permission.utils import get_permissions_for

from .models import Accession
from .accession import RestAccessionId

from django.utils.translation import ugettext_lazy as _


class RestAccessionIdBatch(RestAccessionId):
    regex = r'^batch/$'
    name = 'batch'


class RestAccessionIdBatchSearch(RestAccessionIdBatch):
    regex = r'^search/$'
    suffix = 'search'


@RestAccessionIdBatch.def_auth_request(Method.GET, Format.JSON,
    perms={
        'accession.get_accession': _("You are not allowed to get an accession"),
        'accession.list_batch': _("You are not allowed to list batches for an accession")
    }
)
def accession_batches_list(request, acc_id):
    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = request.GET.get('cursor')
    limit = results_per_page

    accession = get_object_or_404(Accession, id=int(acc_id))

    if cursor:
        cursor_name, cursor_id = cursor.rsplit('/', 1)
        batches = accession.batches.filter(Q(name__gt=cursor_name))
    else:
        batches = accession.batches.all()

    batches = batches.order_by('name')[:limit]

    items_list = []

    for batch in batches:
        b = {
            'id': batch.pk,
            'name': batch.name,
            'accession': accession.id,
            'descriptor_meta_model': batch.descriptor_meta_model.id,
            'descriptors': batch.descriptors
        }

        items_list.append(b)

    if len(items_list) > 0:
        # prev cursor (asc order)
        obj = items_list[0]
        prev_cursor = "%s/%i" % (obj['name'], obj['id'])

        # next cursor (asc order)
        obj = items_list[-1]
        next_cursor = "%s/%i" % (obj['name'], obj['id'])
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


@RestAccessionIdBatchSearch.def_auth_request(Method.GET, Format.JSON, ('filters',))
def search_batches_for_accession(request, acc_id):
    """
    Quick search for batches with a exact or partial name.
    """
    filters = json.loads(request.GET['filters'])
    page = int_arg(request.GET.get('page', 1))

    # @todo cursor (not pagination)
    qs = None

    name_method = filters.get('method', 'ieq')
    if 'meta_model' in filters['fields']:
        meta_model = int_arg(filters['meta_model'])

        if name_method == 'ieq':
            qs = AccessionSynonym.objects.filter(Q(name__iexact=filters['name']))
        elif name_method == 'icontains':
            qs = AccessionSynonym.objects.filter(Q(name__icontains=filters['name']))

        qs = qs.filter(Q(descriptor_meta_model_id=meta_model))
    elif 'name' in filters['fields']:
        if name_method == 'ieq':
            qs = AccessionSynonym.objects.filter(name__iexact=filters['name'])
        elif name_method == 'icontains':
            qs = AccessionSynonym.objects.filter(name__icontains=filters['name'])

    # qs = qs.select_related('synonyms')

    # group by synonyms on labels
    accessions = {}

    for s in qs:
        for acc in s.accessions.all():
            accession = accessions.get(acc.id)
            if accession:
                accession['label'] += ', ' + s.name
            else:
                accessions[acc.id] = {'id': str(acc.id), 'label': s.name, 'value': acc.name}

    accessions_list = list(accessions.values())

    response = {
        'items': accessions_list,
        'page': page
    }

    return HttpResponseRest(request, response)
