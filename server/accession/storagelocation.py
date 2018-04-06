# -*- coding: utf-8;-*-
#
# @file storagelocation.py
# @brief coll-gate storage location rest handler
# @author Medhi BOULNEMOUR (INRA UMR1095)
# @date 2018-03-29
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details

from django.db.models import Q, Prefetch
from django.utils import translation

from accession.base import RestAccession
from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest

from accession.models import StorageLocation
from permission.utils import get_permissions_for
from django.utils.translation import ugettext_lazy as _


class RestStorageLocation(RestAccession):
    regex = r'^storagelocation/$'
    name = 'storagelocation'


class RestStorageLocationId(RestStorageLocation):
    regex = r'^(?P<location_id>[0-9]+)/$'
    suffix = 'id'


class RestStorageLocationSearch(RestStorageLocation):
    regex = r'^search/$'
    suffix = 'search'


@RestStorageLocationId.def_auth_request(Method.GET, Format.JSON)
def get_location_details_json(request, location_id):
    """
    Get the details of a storage location.
    """

    location = StorageLocation.objects.get(id=int(location_id))

    # check permission on this object
    perms = get_permissions_for(request.user, location.content_type.app_label, location.content_type.model, location.pk)
    if 'accession.get_location' not in perms:
        raise PermissionDenied(_('Invalid permission to access to this storage location'))

    children = []

    for child in location.children.all():
        children.append({
            'id': child.id,
            'name': child.name,
            'label': child.get_label()
        })

    result = {
        'id': location.id,
        'name': location.name,
        'label': location.get_label(),
        'parent': {
            'id': location.parent.id,
            'name': location.parent.name,
            'label': location.parent.get_label(),
        },
        'children': children
    }

    return HttpResponseRest(request, result)


@RestStorageLocation.def_auth_request(Method.POST, Format.JSON, content={
    "type": "object",
    "properties": {
        "name": StorageLocation.NAME_VALIDATOR,
        "label": StorageLocation.LABEL_VALIDATOR,
        # "parent_storage_location": {"type": "number"}
    },
}, perms={
    'accession.add_accession': _("You are not allowed to create an accession")
})
def create_storage_location(request):
    """
    Create a storage location.
    """

    name = request.data['name']
    label = request.data['label']

    if isinstance(request.data['parent_storage_location'], int):
        parent_storage_location = StorageLocation.objects.get(id=request.data['parent_storage_location'])
    else:
        parent_storage_location = None

    lang = translation.get_language()

    storage_location = StorageLocation.objects.create(
        name=name,
        parent=parent_storage_location,
        label={lang: label},
    )

    result = {
        'id': storage_location.id,
        'name': storage_location.name,
        'label': storage_location.get_label()
    }

    return HttpResponseRest(request, result)


@RestStorageLocationId.def_auth_request(Method.PATCH, Format.JSON, content={
    "type": "object",
    "properties": {
        "name": StorageLocation.NAME_VALIDATOR,
        "label": StorageLocation.LABEL_VALIDATOR,
        # "parent_storage_location": {"type": "number"}
    },
}, perms={
    'accession.add_accession': _("You are not allowed to create an accession")
})
def create_storage_location(request, location_id):
    """
    Modify a storage location.
    """
    storage_location = StorageLocation.objects.get(id=int(location_id))

    # check permission on this object
    perms = get_permissions_for(request.user, storage_location.content_type.app_label,
                                storage_location.content_type.model, storage_location.pk)
    if 'accession.get_location' not in perms:
        raise PermissionDenied(_('Invalid permission to access to this storage location'))

    name = request.data['name']
    label = request.data['label']

    if isinstance(request.data['parent_storage_location'], int):
        parent_storage_location = StorageLocation.objects.get(id=request.data['parent_storage_location'])
    else:
        parent_storage_location = None

    lang = translation.get_language()

    storage_location.name = name
    storage_location.set_label(lang, label)
    storage_location.parent = parent_storage_location

    result = {
        'id': storage_location.id,
        'name': storage_location.name,
        'label': storage_location.get_label()
    }

    return HttpResponseRest(request, result)


@RestStorageLocation.def_auth_request(Method.GET, Format.JSON, perms={
    'accession.list_location': _("You are not allowed to list the locations")
})
def get_location_list(request):
    results_per_page = int_arg(request.GET.get('more', 0))
    cursor = json.loads(request.GET.get('cursor', 'null'))
    limit = results_per_page
    sort_by = json.loads(request.GET.get('sort_by', '[]'))
    parent_location = request.GET.get('parent', None)

    if parent_location is not None:
        parent_location = int(parent_location)

    if not len(sort_by) or sort_by[-1] not in ('id', '+id', '-id'):
        order_by = sort_by + ['id']
    else:
        order_by = sort_by

    from main.cursor import CursorQuery
    cq = CursorQuery(StorageLocation)
    cq.filter(parent_id=parent_location)

    if request.GET.get('search'):
        search = json.loads(request.GET['search'])
        cq.filter(search)

    if request.GET.get('filters'):
        filters = json.loads(request.GET['filters'])
        cq.filter(filters)

    cq.prefetch_related(Prefetch(
        "children",
        queryset=StorageLocation.objects.all()
    ))

    cq.cursor(cursor, order_by)
    cq.order_by(order_by).limit(limit)

    location_list = []

    for storage_location in cq:
        sl = {
            'id': storage_location.id,
            'name': storage_location.name,
            'label': storage_location.get_label(),
            'children_count': storage_location.children.count()
        }

        location_list.append(sl)

    results = {
        'perms': [],
        'items': location_list,
        'prev': cq.prev_cursor,
        'cursor': cursor,
        'next': cq.next_cursor,
    }

    return HttpResponseRest(request, results)


@RestStorageLocationSearch.def_auth_request(Method.GET, Format.JSON, ('filters',), perms={
    'accession.search_location': _("You are not allowed to search storage locations")
})
def search_accession(request):
    """
    @todo modify the following method description
    Quick search for a storage location with a exact or partial name and labels.

    The filters can be :
        - name: value to look for the name field.
        - method: for the name 'ieq' or 'icontains' for insensitive case equality or %like% respectively.
        - label: value to look for the label field.
        - fields: list of fields to look for.
    """
    filters = json.loads(request.GET['filters'])

    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = request.GET.get('cursor')
    limit = results_per_page

    if cursor:
        cursor = json.loads(cursor)
        cursor_name, cursor_id = cursor
        qs = StorageLocation.objects.filter(Q(name__gt=cursor_name))
    else:
        qs = StorageLocation.objects.all()

    name_method = filters.get('method', 'ieq')
    if 'name' in filters['fields']:
        if name_method == 'ieq':
            qs = qs.filter(name__iexact=filters['name'])
        elif name_method == 'icontains':
            qs = qs.filter(name__icontains=filters['name'])
    elif 'label' in filters['fields']:
        if name_method == 'ieq':
            qs = qs.filter(
                Q(label__fr__iexact=filters['label']) | Q(label__en__iexact=filters['label']))  # more languages... ?
        elif name_method == 'icontains':
            qs = qs.filter(label__icontains=filters['label'])

    qs = qs.order_by('name').distinct()[:limit]

    items_list = []

    for storage_location in qs:
        a = {
            'id': storage_location.id,
            'name': storage_location.name,
            'label': storage_location.get_label(),
            'value': storage_location.id
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
