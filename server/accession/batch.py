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
