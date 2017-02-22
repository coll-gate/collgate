# -*- coding: utf-8; -*-
#
# Copyright (c) 2017 INRA UMR1095 GDEC

"""
coll-gate batch rest handler
"""

from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import SuspiciousOperation
from django.db import IntegrityError
from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404

from descriptor.describable import DescriptorsBuilder
from descriptor.models import DescriptorMetaModel
from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest
from main.models import Languages, EntityStatus
from permission.utils import get_permissions_for
from taxonomy.models import Taxon

from .models import Accession, Batch
from .base import RestAccession

from django.utils.translation import ugettext_lazy as _


class RestBatch(RestAccession):
    regex = r'^batch/$'
    name = 'batch'


class RestBatchSearch(RestBatch):
    regex = r'^search/$'
    suffix = 'search'


class RestBatchId(RestBatch):
    regex = r'^(?P<bat_id>[0-9]+)/$'
    suffix = 'id'


class RestBatchIdBatch(RestBatchId):
    regex = r'^batch/$'
    suffix = 'batch'


@RestBatchId.def_auth_request(Method.GET, Format.JSON)
def get_batch_details_json(request, bat_id):
    """
    Get the details of a batch.
    """
    batch = Batch.objects.get(id=int(bat_id))

    # check permission on this object
    perms = get_permissions_for(request.user, batch.content_type.app_label, batch.content_type.model, batch.pk)
    if 'accession.get_batch' not in perms:
        raise PermissionDenied(_('Invalid permission to access to this batch'))

    result = {
        'id': batch.id,
        'name': batch.name,
        'accession': batch.accession_id,
        'descriptor_meta_model': batch.descriptor_meta_model_id,
        'descriptors': batch.descriptors
    }

    return HttpResponseRest(request, result)


@RestBatchId.def_auth_request(Method.DELETE, Format.JSON, perms={
    'batch.delete_batch': _("You are not allowed to delete a batch"),
})
def delete_batch(request, bat_id):
    batch = get_object_or_404(Batch, id=int(bat_id))

    batch.delete()

    return HttpResponseRest(request, {})


@RestBatchIdBatch.def_auth_request(Method.GET, Format.JSON, perms={
    'accession.get_accession': _("You are not allowed to get an accession"),
    'accession.list_batch': _("You are not allowed to list batches for an accession")
})
def batch_batches_list(request, bat_id):
    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = request.GET.get('cursor')
    limit = results_per_page

    parent_batch = get_object_or_404(Batch, id=int(bat_id))

    # check permission on accession object
    perms = get_permissions_for(
        request.user,
        parent_batch.accession.content_type.app_label,
        parent_batch.accession.content_type.model,
        parent_batch.accession.pk)
    if 'accession.get_accession' not in perms:
        raise PermissionDenied(_('Invalid permission to access to this accession'))

    if cursor:
        cursor_name, cursor_id = cursor.rsplit('/', 1)
        batches = parent_batch.batches.filter(Q(name__gt=cursor_name))
    else:
        batches = parent_batch.batches.all()

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
