# -*- coding: utf-8; -*-
#
# Copyright (c) 2017 INRA UMR1095 GDEC

"""
coll-gate accession batch rest handler
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
        entity = items_list[0]
        prev_cursor = "%s/%s" % (entity['name'], entity['id'])

        # next cursor (asc order)
        entity = items_list[-1]
        next_cursor = "%s/%s" % (entity['name'], entity['id'])
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

