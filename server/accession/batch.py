# -*- coding: utf-8; -*-
#
# @file batch.py
# @brief coll-gate batch rest handler
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2017-01-03
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import SuspiciousOperation
from django.db import IntegrityError
from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404

from accession.actions.actionstepformat import ActionStepFormatManager
from accession.namebuilder import NameBuilderManager
from descriptor.describable import DescriptorsBuilder
from descriptor.models import Layout
from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest
from permission.utils import get_permissions_for

from .models import Accession, Batch, BatchPanel
from .base import RestAccession

from django.utils.translation import ugettext_lazy as _


class RestBatch(RestAccession):
    regex = r'^batch/$'
    name = 'batch'


class RestBatchSearch(RestBatch):
    regex = r'^search/$'
    suffix = 'search'


class RestBatchCount(RestBatch):
    regex = r'^count/$'
    name = 'count'


class RestBatchId(RestBatch):
    regex = r'^(?P<bat_id>[0-9]+)/$'
    suffix = 'id'


class RestBatchIdBatch(RestBatchId):
    regex = r'^batch/$'
    suffix = 'batch'


class RestBatchIdBatchCount(RestBatchIdBatch):
    regex = r'^count/$'
    suffix = 'count'


class RestBatchIdParent(RestBatchId):
    regex = r'^parent/$'
    suffix = 'parent'


class RestBatchIdParentCount(RestBatchIdParent):
    regex = r'^count/$'
    suffix = 'count'


class RestBatchIdComment(RestBatchId):
    regex = r'^comment/$'
    suffix = 'comment'


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
        'layout': batch.layout_id,
        'descriptors': batch.descriptors,
        'comments': batch.comments
    }

    return HttpResponseRest(request, result)


@RestBatch.def_auth_request(Method.POST, Format.JSON, content={
    "type": "object",
    "properties": {
        # "name": Batch.NAME_VALIDATOR,
        "naming_options": {"type": "array", 'minItems': 0, 'maxItems': 10, 'additionalItems': {'type': 'any'},
                           'items': []},
        "layout": {"type": "number"},
        "accession": {"type": "number"},
        "descriptors": {"type": "object"}
    },
}, perms={
    'accession.add_accession': _("You are not allowed to create a batch")
}
                            )
def create_batch(request):
    """
    This is the deprecated way of creating a batch. Creation of a batch must be supervised
    by an action of creation.
    This method still because of its interest during development process.
    """
    # name = request.data['name']
    naming_options = request.data['naming_options']
    accession_id = int_arg(request.data['accession'])
    layout_id = int_arg(request.data['layout'])
    descriptors = request.data['descriptors']

    # batch selection
    selection = request.data['selection']['select']
    related_entity = request.data['selection']['from']
    search = request.data['selection']['search']
    filters = request.data['selection']['filters']

    # naming
    accession = get_object_or_404(Accession, id=accession_id)
    naming_variables = {
        'ACCESSION_NAME': accession.name,
        'ACCESSION_CODE': accession.code
    }
    name = NameBuilderManager.get(NameBuilderManager.GLOBAL_BATCH).pick(naming_variables, naming_options)

    # check uniqueness of the name
    if Batch.objects.filter(name=name).exists():
        raise SuspiciousOperation(_("The name of the batch is already used"))

    content_type = get_object_or_404(ContentType, app_label="accession", model="batch")
    layout = get_object_or_404(Layout, id=layout_id, target=content_type)

    from main.cursor import CursorQuery
    cq = CursorQuery(Batch)

    if search:
        cq.filter(search)

    if filters:
        cq.filter(filters)

    if related_entity:
        label, model = related_entity['content_type'].split('.')
        content_type = get_object_or_404(ContentType, app_label=label, model=model)
        model_class = content_type.model_class()
        cq.inner_join(model_class, **{model: int_arg(related_entity['id'])})

    try:
        with transaction.atomic():
            # common properties
            batch = Batch()
            batch.name = name
            batch.layout = layout

            # parent accession
            accession = get_object_or_404(Accession, id=accession_id)
            batch.accession = accession

            # descriptors
            descriptors_builder = DescriptorsBuilder(batch)

            descriptors_builder.check_and_update(layout, descriptors)
            batch.descriptors = descriptors_builder.descriptors

            batch.save()

            # parent batches
            if isinstance(selection, bool):
                if selection is True:
                    batch.batches.add(*cq)

            elif selection['op'] == 'in':
                batch.batches.add(*cq.filter(id__in=selection['value']))

            elif selection['op'] == 'notin':
                batch.batches.add(*cq.filter(id__notin=selection['value']))

            # update owner on external descriptors
            descriptors_builder.update_associations()
    except IntegrityError as e:
        logger.error(repr(e))
        raise SuspiciousOperation(_("Unable to create the batch"))

    response = {
        'id': batch.pk,
        'name': batch.name,
        'layout': layout.id,
        'accession': accession.id,
        'descriptors': descriptors
    }

    return HttpResponseRest(request, response)


@RestBatchId.def_auth_request(Method.PATCH, Format.JSON, content={
        "type": "object",
        "properties": {
            "entity_status": Batch.ENTITY_STATUS_VALIDATOR_OPTIONAL,
            "descriptors": {"type": "object", "required": False}
        },
    }, perms={
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
                batch.update_field('entity_status')

            if descriptors is not None:
                # update descriptors
                descriptors_builder = DescriptorsBuilder(batch)

                descriptors_builder.check_and_update(batch.layout, descriptors)

                batch.descriptors = descriptors_builder.descriptors
                result['descriptors'] = batch.descriptors

                descriptors_builder.update_associations()

                batch.update_descriptors(descriptors_builder.changed_descriptors())
                batch.update_field('descriptors')

            batch.save()
    except IntegrityError as e:
        logger.error(repr(e))
        raise SuspiciousOperation(_("Unable to update the batch"))

    return HttpResponseRest(request, result)


@RestBatchId.def_auth_request(Method.DELETE, Format.JSON, perms={
    'accession.delete_batch': _("You are not allowed to delete a batch"),
})
def delete_batch(request, bat_id):
    batch = get_object_or_404(Batch, id=int(bat_id))
    # @todo should not delete... archive, maybe delete when no children and just introduction batch ?
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
        cursor = json.loads(cursor)
        cursor_name, cursor_id = cursor
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
            'layout': batch.layout_id,
            'descriptors': batch.descriptors,
            'location': batch.location
        }

        items_list.append(b)

    if len(items_list) > 0:
        # prev cursor (asc order)
        obj = items_list[0]
        prev_cursor = (obj['name'], obj['id'])

        # next cursor (asc order)
        obj = items_list[-1]
        next_cursor = (obj['name'], obj['id'])
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


@RestBatchIdBatchCount.def_auth_request(Method.GET, Format.JSON, perms={
    'accession.get_accession': _("You are not allowed to get an accession"),
    'accession.list_batch': _("You are not allowed to list children batches for a batch")
})
def get_batch_children_batches_list_count(request, bat_id):
    cursor = request.GET.get('cursor')

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
        cursor = json.loads(cursor)
        cursor_name, cursor_id = cursor
        batches = parent_batch.children.filter(Q(name__gt=cursor_name))
    else:
        batches = parent_batch.children.all()

    results = {
        'count': batches.count()
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
        cursor = json.loads(cursor)
        cursor_name, cursor_id = cursor
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
            'layout': batch.layout_id,
            'descriptors': batch.descriptors,
            'location': batch.location
        }

        items_list.append(b)

    if len(items_list) > 0:
        # prev cursor (asc order)
        obj = items_list[0]
        prev_cursor = (obj['name'], obj['id'])

        # next cursor (asc order)
        obj = items_list[-1]
        next_cursor = (obj['name'], obj['id'])
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


@RestBatchIdParentCount.def_auth_request(Method.GET, Format.JSON, perms={
    'accession.get_accession': _("You are not allowed to get an accession"),
    'accession.list_batch': _("You are not allowed to list parent batches for a batch")
})
def get_batch_parents_batches_list_count(request, bat_id):
    cursor = request.GET.get('cursor')
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
        cursor = json.loads(cursor)
        cursor_name, cursor_id = cursor
        batches = parent_batch.batches.filter(Q(name__gt=cursor_name))
    else:
        batches = parent_batch.batches.all()

    results = {
        'count': batches.count()
    }

    return HttpResponseRest(request, results)


@RestBatchSearch.def_auth_request(Method.GET, Format.JSON, ('filters',), perms={
    'accession.get_accession': _("You are not allowed to get an accession"),
    'accession.search_batch': _("You are not allowed to search batches")
})
def search_batch(request):
    """
    Quick search for batch with a exact or partial name and layout of descriptor.

    The filters can be :
        - name: value to look for the name field.
        - method: for the name 'ieq' or 'icontains' for insensitive case equality or %like% respectively.
        - layout: id of the descriptor layout to look for.
        - fields: list of fields to look for.
    """
    filters = json.loads(request.GET['filters'])

    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = request.GET.get('cursor')
    limit = results_per_page

    if cursor:
        cursor = json.loads(cursor)
        cursor_name, cursor_id = cursor
        qs = Batch.objects.filter(Q(name__gt=cursor_name))
    else:
        qs = Batch.objects.all()

    name_method = filters.get('method', 'ieq')
    if 'layout' in filters['fields']:
        layout = int_arg(filters['layout'])

        if name_method == 'ieq':
            qs = qs.filter(Q(name__iexact=filters['name']))
        elif name_method == 'icontains':
            qs = qs.filter(Q(name__icontains=filters['name']))

        qs = qs.filter(Q(layout_id=layout))
    elif 'name' in filters['fields']:
        if name_method == 'ieq':
            qs = qs.filter(name__iexact=filters['name'])
        elif name_method == 'icontains':
            qs = qs.filter(name__icontains=filters['name'])

    qs = qs.order_by('name')[:limit]

    items_list = []

    for batch in qs:
        label = batch.name

        a = {
            'id': batch.id,
            'label': label,
            'value': batch.name
        }

        items_list.append(a)

    if len(items_list) > 0:
        # prev cursor (asc order)
        obj = items_list[0]
        prev_cursor = (obj['value'], obj['id'])

        # next cursor (asc order)
        obj = items_list[-1]
        next_cursor = (obj['value'], obj['id'])
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


@RestBatch.def_auth_request(Method.GET, Format.JSON, perms={
    'accession.get_accession': _("You are not allowed to get an accession"),
    'accession.list_batch': _("You are not allowed to list the batches")
})
def get_batch_list(request):
    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = json.loads(request.GET.get('cursor', 'null'))
    limit = results_per_page
    sort_by = json.loads(request.GET.get('sort_by', '[]'))

    # @todo how to manage permission to list only auth batches

    if not len(sort_by) or sort_by[-1] not in ('id', '+id', '-id'):
        order_by = sort_by + ['id']
    else:
        order_by = sort_by

    from main.cursor import CursorQuery
    cq = CursorQuery(Batch)

    if request.GET.get('search'):
        search = json.loads(request.GET['search'])
        cq.filter(search)

    if request.GET.get('filters'):
        filters = json.loads(request.GET['filters'])
        cq.filter(filters)

    cq.m2m_to_array_field(
        relationship=BatchPanel.batches,
        selected_field='batchpanel_id',
        from_related_field='id',
        to_related_field='batch_id',
        alias='panels'
    )

    cq.cursor(cursor, order_by)
    cq.order_by(order_by).limit(limit)

    batch_list = []

    for batch in cq:
        a = {
            'id': batch.pk,
            'name': batch.name,
            'accession': batch.accession_id,
            'layout': batch.layout_id,
            'descriptors': batch.descriptors,
            'location': batch.location.get_label() if batch.location else None
        }

        batch_list.append(a)

    results = {
        'perms': [],
        'items': batch_list,
        'prev': cq.prev_cursor,
        'cursor': cursor,
        'next': cq.next_cursor,
    }

    return HttpResponseRest(request, results)


@RestBatchCount.def_auth_request(Method.GET, Format.JSON, perms={
    'accession.list_batch': _("You are not allowed to list the batches")
})
def get_batch_list_count(request):
    from main.cursor import CursorQuery
    cq = CursorQuery(Batch)

    if request.GET.get('search'):
        search = json.loads(request.GET['search'])
        cq.filter(search)

    if request.GET.get('filters'):
        filters = json.loads(request.GET['filters'])
        cq.filter(filters)

    cq.m2m_to_array_field(
        relationship=BatchPanel.batches,
        selected_field='batchpanel_id',
        from_related_field='id',
        to_related_field='batch_id',
        alias='panels'
    )

    count = cq.count()

    results = {
        'count': count
    }

    return HttpResponseRest(request, results)


@RestBatchIdComment.def_auth_request(Method.GET, Format.JSON, perms={
      'accession.get_batch': _("You are not allowed to get a batch"),
    })
def get_batch_comment_list(request, bat_id):
    batch = get_object_or_404(Batch, id=int(bat_id))
    result = batch.comments

    return HttpResponseRest(request, result)


@RestBatchIdComment.def_auth_request(Method.DELETE, Format.JSON, content={'type': 'string', 'minLength': 3, 'maxLength': 128}, perms={
    'accession.change_batch': _("You are not allowed to modify a batch"),
})
def remove_batch_comment(request, bat_id):
    batch = get_object_or_404(Batch, id=int(bat_id))

    comment_label = request.data
    found = False

    # update comments
    for comment in batch.comments:
        if comment['label'] == comment_label:
            del comment
            found = True

    if not found:
        raise SuspiciousOperation(_("Comment label does not exists."))

    result = batch.comments

    return HttpResponseRest(request, result)


@RestBatchIdComment.def_auth_request(Method.POST, Format.JSON, content=Batch.COMMENT_VALIDATOR, perms={
  'accession.change_batch': _("You are not allowed to modify a batch"),
})
def add_batch_comment(request, bat_id):
    batch = get_object_or_404(Batch, id=int(bat_id))
    comment_data = request.data

    # update comments
    for comment in batch.comments:
        if comment['label'] == comment_data['label']:
            raise SuspiciousOperation(_("Comment label already exists. Try another."))

    batch.comments.add = comment_data

    batch.update_field('comments')
    batch.save()

    results = batch.comments

    return HttpResponseRest(request, results)


@RestBatchIdComment.def_auth_request(Method.PATCH, Format.JSON, content=Batch.COMMENT_VALIDATOR, perms={
    'accession.change_batch': _("You are not allowed to modify a batch"),
})
def patch_batch_comment(request, bat_id):
    batch = get_object_or_404(Batch, id=int(bat_id))
    comment_data = request.data

    # update comments
    for comment in batch.comments:
        if comment['label'] == comment_data['label']:
            comment['value'] = comment_data['value']

    # batch.comments = comments

    batch.update_field('comments')
    batch.save()

    result = batch.comments

    return HttpResponseRest(request, result)
