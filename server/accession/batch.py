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


class RestBatchIdParent(RestBatchId):
    regex = r'^parent/$'
    suffix = 'parent'


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


@RestBatch.def_auth_request(Method.POST, Format.JSON, content={
        "type": "object",
        "properties": {
            "name": {"type": "string", 'minLength': 3, 'maxLength': 128},
            "descriptor_meta_model": {"type": "number"},
            "accession": {"type": "number"},
            "descriptors": {"type": "object"}
        },
    }, perms={
        'accession.add_accession': _("You are not allowed to create a batch")
    }
)
def create_batch(request):
    # @todo name generator
    name = request.data['name']
    dmm_id = int_arg(request.data['descriptor_meta_model'])
    accession_id = int_arg(request.data['parent'])
    descriptors = request.data['descriptors']

    # check uniqueness of the name
    if Batch.objects.filter(name=name).exists():
        raise SuspiciousOperation(_("The name of the batch is already used"))

    content_type = get_object_or_404(ContentType, app_label="accession", model="batch")
    dmm = get_object_or_404(DescriptorMetaModel, id=dmm_id, target=content_type)

    parent_batch_list = []

    try:
        with transaction.atomic():
            # common properties
            batch = Batch()
            batch.name = name
            batch.descriptor_meta_model = dmm

            # parent accession
            accession = get_object_or_404(Accession, id=accession_id)
            batch.accession = accession

            # descriptors
            descriptors_builder = DescriptorsBuilder(batch)

            descriptors_builder.check_and_update(dmm, descriptors)
            batch.descriptors = descriptors_builder.descriptors

            batch.save()

            # update owner on external descriptors
            descriptors_builder.update_associations()
    except IntegrityError as e:
        logger.error(repr(e))
        raise SuspiciousOperation(_("Unable to create the batch"))

    response = {
        'id': batch.pk,
        'name': batch.name,
        'descriptor_meta_model': dmm.id,
        'accession': accession.id,
        'batches': parent_batch_list,
        'descriptors': descriptors
    }

    return HttpResponseRest(request, response)


@RestBatchId.def_auth_request(Method.PATCH, Format.JSON, content={
        "type": "object",
        "properties": {
            "entity_status": {"type": "integer", "minimum": 0, "maximum": 3, "required": False},
            "descriptors": {"type": "object", "required": False},
        },
    },
    perms={
        'accession.change_batch': _("You are not allowed to modify a batch"),
    })
def patch_batch(request, bat_id):
    batch = get_object_or_404(Batch, id=int(bat_id))

    # check permission on accession object
    perms = get_permissions_for(
        request.user,
        batch.accession.content_type.app_label,
        batch.accession.content_type.model,
        batch.accession.pk)
    if 'accession.change_accession' not in perms:
        raise PermissionDenied(_('Invalid permission to modify this accession'))

    entity_status = request.data.get("entity_status")
    descriptors = request.data.get("descriptors")

    result = {
        'id': batch.id
    }

    try:
        with transaction.atomic():
            if entity_status is not None and batch.entity_status != entity_status:
                batch.set_status(entity_status)
                result['entity_status'] = entity_status

            if descriptors is not None:
                # update descriptors
                descriptors_builder = DescriptorsBuilder(batch)

                descriptors_builder.check_and_update(batch.descriptor_meta_model, descriptors)

                batch.descriptors = descriptors_builder.descriptors
                result['descriptors'] = batch.descriptors

                descriptors_builder.update_associations()

                batch.descriptors_diff = descriptors
                batch.update_field('descriptors')

                batch.save()
    except IntegrityError as e:
        logger.error(repr(e))
        raise SuspiciousOperation(_("Unable to update the batch"))

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
def get_batch_batches_list(request, bat_id):
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
        batches = parent_batch.children.filter(Q(name__gt=cursor_name))
    else:
        batches = parent_batch.children.all()

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


@RestBatchIdParent.def_auth_request(Method.GET, Format.JSON, perms={
    'accession.get_accession': _("You are not allowed to get an accession"),
    'accession.list_batch': _("You are not allowed to list parent batches for a batch")
})
def get_batch_parents_batches_list(request, bat_id):
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
