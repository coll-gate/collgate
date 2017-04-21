# -*- coding: utf-8; -*-
#
# @file accessionbatch.py
# @brief 
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2017-01-03
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

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


@RestAccessionIdBatch.def_auth_request(Method.GET, Format.JSON, perms={
    'accession.get_accession': _("You are not allowed to get an accession"),
    'accession.list_batch': _("You are not allowed to list batches for an accession")
})
def accession_batches_list(request, acc_id):
    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = request.GET.get('cursor')
    limit = results_per_page

    accession = get_object_or_404(Accession, id=int(acc_id))

    # check permission on accession object
    perms = get_permissions_for(request.user, accession.content_type.app_label, accession.content_type.model,
                                accession.pk)
    if 'accession.get_accession' not in perms:
        raise PermissionDenied(_('Invalid permission to access to this accession'))

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
            'accession': batch.accession_id,
            'descriptor_meta_model': batch.descriptor_meta_model_id,
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


@RestAccessionIdBatchSearch.def_auth_request(Method.GET, Format.JSON, ('filters',), perms={
    'accession.get_accession': _("You are not allowed to get an accession"),
    'accession.search_batch': _("You are not allowed to list batches for an accession")
})
def search_batches_for_accession(request, acc_id):
    """
    Quick search for batches with a exact or partial name.
    """
    filters = json.loads(request.GET['filters'])

    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = request.GET.get('cursor')
    limit = results_per_page

    accession = get_object_or_404(Accession, id=int(acc_id))

    # check permission on accession object
    perms = get_permissions_for(request.user, accession.content_type.app_label, accession.content_type.model,
                                accession.pk)
    if 'accession.get_accession' not in perms:
        raise PermissionDenied(_('Invalid permission to access to this accession'))

    if cursor:
        cursor_name, cursor_id = cursor.rsplit('/', 1)
        batches = accession.batches.filter(Q(name__gt=cursor_name))
    else:
        batches = accession.batches.all()

    if 'name' in filters['fields']:
        name_method = filters.get('method', 'ieq')

        if name_method == 'ieq':
            batches = batches.filter(name__iexact=filters['name'])
        elif name_method == 'icontains':
            batches = batches.filter(name__icontains=filters['name'])

    batches = batches.order_by('name')[:limit]

    items_list = []

    for batch in batches:
        b = {
            'id': batch.pk,
            'name': batch.name,
            'accession': accession.id,
            'descriptor_meta_model': batch.descriptor_meta_model_id,
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

