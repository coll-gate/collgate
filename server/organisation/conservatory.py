# -*- coding: utf-8; -*-
#
# @file conservatory
# @brief collgate 
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2018-06-20
# @copyright Copyright (c) 2018 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import SuspiciousOperation
from django.db import transaction, IntegrityError
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils.translation import ugettext_lazy as _

from descriptor.describable import DescriptorsBuilder
from descriptor.models import Layout, Descriptor
from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest
from main.cursor import CursorQuery
from organisation.models import Establishment, Conservatory

from .base import RestOrganisationModule
from .establishment import RestEstablishmentId


class RestConservatory(RestOrganisationModule):
    regex = r'^conservatory/$'
    name = 'conservatory'


class RestConservatorySearch(RestConservatory):
    regex = r'^search/$'
    suffix = 'search'


class RestConservatoryId(RestConservatory):
    regex = r'^(?P<con_id>[0-9]+)/$'
    suffix = 'id'


class RestEstablishmentIdConservatory(RestEstablishmentId):
    regex = r'^conservatory/$'
    suffix = 'conservatory'


class RestEstablishmentIdConservatoryCount(RestEstablishmentIdConservatory):
    regex = r'^count/$'
    name = 'count'


@RestEstablishmentIdConservatory.def_auth_request(Method.GET, Format.JSON)
def get_conservatory_list_for_establishment(request, est_id):
    """
    List all conservatory for a specific establishment.
    """
    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = json.loads(request.GET.get('cursor', 'null'))
    limit = results_per_page
    sort_by = json.loads(request.GET.get('sort_by', '[]'))

    if not len(sort_by) or sort_by[-1] not in ('id', '+id', '-id'):
        order_by = sort_by + ['id']
    else:
        order_by = sort_by

    cq = CursorQuery(Conservatory)
    cq.filter(establishment=int(est_id))

    if request.GET.get('search'):
        cq.filter(json.loads(request.GET['search']))

    if request.GET.get('filters'):
        cq.filter(json.loads(request.GET['filters']))

    cq.cursor(cursor, order_by)
    cq.order_by(order_by).limit(limit)
    cq.select_related('establishment->id', 'establishment->name')

    conservatory_items = []

    for conservatory in cq:
        t = {
            'id': conservatory.pk,
            'name': conservatory.name,
            'descriptors': conservatory.descriptors,
            'comments': conservatory.comments,
            'layout': conservatory.layout,
            'establishment': conservatory.establishment_id,
            'establishment_details': {
                'id': conservatory.establishment.id,
                'name': conservatory.establishment.name
            }
        }

        conservatory_items.append(t)

    results = {
        'perms': [],
        'items': conservatory_items,
        'prev': cq.prev_cursor,
        'cursor': cursor,
        'next': cq.next_cursor
    }

    return HttpResponseRest(request, results)


@RestEstablishmentIdConservatoryCount.def_auth_request(Method.GET, Format.JSON)
def get_count_conservatory_list_for_establishment(request, est_id):
    """
    Count conservatory for an establishment.
    """
    cq = CursorQuery(Conservatory)
    cq.filter(establishment=int(est_id))

    if request.GET.get('search'):
        cq.filter(json.loads(request.GET['search']))

    if request.GET.get('filters'):
        cq.filter(json.loads(request.GET['filters']))

    results = {
        'perms': [],
        'count': cq.count()
    }

    return HttpResponseRest(request, results)


@RestConservatorySearch.def_auth_request(Method.GET, Format.JSON, ('filters',))
def search_person(request):
    """
    Quick search for a person with a exact or partial first name, last name, surname, name.
    """
    filters = json.loads(request.GET['filters'])

    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = request.GET.get('cursor')
    limit = results_per_page

    if cursor:
        cursor = json.loads(cursor)
        cursor_name, cursor_id = cursor
        qs = Conservatory.objects.filter(Q(name__gt=cursor_name))
    else:
        qs = Conservatory.objects.all()

    if 'code' in filters['fields']:
        code_method = filters.get('method', 'ieq')

        if code_method == 'ieq':
            qs = qs.filter(name__iexact=filters['name'])
        elif code_method == 'icontains':
            qs = qs.filter(name__icontains=filters['name'])

    qs = qs.order_by('name').distinct()[:limit]

    items_list = []

    # need to use data from descriptors
    for conservatory in qs:
        label = conservatory.name

        a = {
            'id': conservatory.id,
            'label': label,
            'value': conservatory.name
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


@RestConservatory.def_auth_request(Method.POST, Format.JSON, content={
    "type": "object",
    "properties": {
        "name": Conservatory.NAME_VALIDATOR,
        "establishment": {"type": "number"},
        "descriptors": {"type": "object"},
        "comments": Conservatory.COMMENT_VALIDATOR
    },
}, perms={
    'organisation.add_conservatory': _('You are not allowed to create a conservatory'),
    'organisation.change_establishment': _('You are not allowed to modify an establishment'),
    'organisation.change_organisation': _("You are not allowed to modify an organisation"),
})
def create_conservatory(request):
    """
    Create a new conservatory.
    """
    descriptors = request.data['descriptors']
    comments = request.data['comments']
    est_id = request.data['establishment']
    name = request.data['name']

    # check existence of the establishment
    establishment = get_object_or_404(Establishment, id=int(est_id))

    content_type = get_object_or_404(ContentType, app_label="organisation", model="conservatory")
    layout = get_object_or_404(Layout, name="conservatory", target=content_type)

    conservatory = None

    try:
        with transaction.atomic():
            # common properties
            conservatory = Conservatory()
            conservatory.name = name
            conservatory.layout = layout
            conservatory.establishment = establishment

            # descriptors
            descriptors_builder = DescriptorsBuilder(conservatory)

            descriptors_builder.check_and_update(layout, descriptors)
            conservatory.descriptors = descriptors_builder.descriptors

            # comments
            conservatory.comments = comments

            conservatory.save()

            # update owner on external descriptors
            descriptors_builder.update_associations()
    except IntegrityError as e:
        Descriptor.integrity_except(Conservatory, e)

    response = {
        'id': conservatory.id,
        'name': conservatory.name,
        'establishment': establishment.id,
        'layout': layout.id,
        'descriptors': conservatory.descriptors,
        'comments': conservatory.comments
    }

    return HttpResponseRest(request, response)


@RestConservatoryId.def_auth_request(Method.GET, Format.JSON)
def get_conservatory_details(request, con_id):
    conservatory = Conservatory.objects.get(id=int(con_id))

    result = {
        'id': conservatory.id,
        'name': conservatory.name,
        'establishment': conservatory.establishment_id,
        'layout': conservatory.layout_id,
        'descriptors': conservatory.descriptors,
        'comments': conservatory.comments
    }

    return HttpResponseRest(request, result)


@RestConservatoryId.def_auth_request(Method.PATCH, Format.JSON, content={
        "type": "object",
        "properties": {
            "code": Conservatory.NAME_VALIDATOR_OPTIONAL,
            "entity_status": Conservatory.ENTITY_STATUS_VALIDATOR_OPTIONAL,
            "descriptors": {"type": "object", "required": False},
            "comments": Conservatory.COMMENT_VALIDATOR_OPTIONAL
        },
    },
    perms={
        'organisation.change_conservatory': _("You are not allowed to modify a conservatory"),
        'organisation.change_establishment': _("You are not allowed to modify an establishment"),
        'organisation.change_organisation': _("You are not allowed to modify an organisation")
    })
def patch_conservatory(request, con_id):
    conservatory = get_object_or_404(Conservatory, id=int(con_id))

    conservatory_name = request.data.get("name")
    entity_status = request.data.get("entity_status")
    descriptors = request.data.get("descriptors")
    comments = request.data.get("comments")

    result = {
        'id': conservatory.id
    }

    try:
        with transaction.atomic():
            if conservatory_name is not None:
                conservatory.name = conservatory_name
                result['name'] = conservatory_name

                conservatory.update_field('name')

            if entity_status is not None and conservatory.entity_status != entity_status:
                conservatory.set_status(entity_status)
                result['entity_status'] = entity_status

            if descriptors is not None:
                # update descriptors
                descriptors_builder = DescriptorsBuilder(conservatory)

                descriptors_builder.check_and_update(conservatory.layout, descriptors)

                conservatory.descriptors = descriptors_builder.descriptors
                result['descriptors'] = conservatory.descriptors

                descriptors_builder.update_associations()

                conservatory.update_descriptors(descriptors_builder.changed_descriptors())
                conservatory.update_field('descriptors')

            if comments is not None:
                # update comments
                conservatory.comments = comments
                result['comments'] = conservatory.comments

                conservatory.update_field('comments')

                conservatory.save()
    except IntegrityError as e:
        Descriptor.integrity_except(Conservatory, e)

    return HttpResponseRest(request, result)


@RestConservatoryId.def_auth_request(Method.DELETE, Format.JSON, perms={
    'organisation.delete_conservatory': _("You are not allowed to delete a conservatory"),
    'organisation.change_establishment': _("You are not allowed to modify an establishment"),
    'organisation.change_organisation': _("You are not allowed to modify an organisation"),
})
def delete_conservatory(request, con_id):
    conservatory = get_object_or_404(Conservatory, id=int(con_id))

    conservatory.delete()

    return HttpResponseRest(request, {})
