# -*- coding: utf-8; -*-
#
# @file person
# @brief collgate 
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2018-06-07
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
from organisation.models import Organisation, Establishment, Person

from .base import RestOrganisationModule
from .establishment import RestEstablishmentId


class RestPerson(RestOrganisationModule):
    regex = r'^person/$'
    name = 'person'


class RestPersonSearch(RestPerson):
    regex = r'^search/$'
    suffix = 'search'


class RestPersonId(RestPerson):
    regex = r'^(?P<per_id>[0-9]+)/$'
    suffix = 'id'


class RestEstablishmentIdPerson(RestEstablishmentId):
    regex = r'^person/$'
    suffix = 'person'


class RestEstablishmentIdPersonCount(RestEstablishmentIdPerson):
    regex = r'^count/$'
    name = 'count'


@RestEstablishmentIdPerson.def_auth_request(Method.GET, Format.JSON)
def get_person_list_for_establishment(request, est_id):
    """
    List all persons for a specific establishment.
    """
    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = json.loads(request.GET.get('cursor', 'null'))
    limit = results_per_page
    sort_by = json.loads(request.GET.get('sort_by', '[]'))

    if not len(sort_by) or sort_by[-1] not in ('id', '+id', '-id'):
        order_by = sort_by + ['id']
    else:
        order_by = sort_by

    cq = CursorQuery(Person)
    cq.filter(establishment=int(est_id))

    if request.GET.get('search'):
        cq.filter(json.loads(request.GET['search']))

    if request.GET.get('filters'):
        cq.filter(json.loads(request.GET['filters']))

    cq.cursor(cursor, order_by)
    cq.order_by(order_by).limit(limit)
    cq.select_related('establishment->id', 'establishment->name')

    person_items = []

    for person in cq:
        t = {
            'id': person.pk,
            'descriptors': person.descriptors,
            'layout': person.layout,
            'establishment': person.establishment_id,
            'establishment_details': {
                'id': person.establishment.id,
                'name': person.establishment.name
            }
        }

        person_items.append(t)

    results = {
        'perms': [],
        'items': person_items,
        'prev': cq.prev_cursor,
        'cursor': cursor,
        'next': cq.next_cursor
    }

    return HttpResponseRest(request, results)


@RestEstablishmentIdPersonCount.def_auth_request(Method.GET, Format.JSON)
def get_count_person_list_for_establishment(request, est_id):
    """
    Count persons for an establishment.
    """
    cq = CursorQuery(Person)
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


@RestPersonSearch.def_auth_request(Method.GET, Format.JSON, ('filters',))
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
        qs = Person.objects.filter(Q(name__gt=cursor_name))
    else:
        qs = Person.objects.all()

    if 'name' in filters['fields']:
        name_method = filters.get('method', 'ieq')

        if name_method == 'ieq':
            qs = qs.filter(name__iexact=filters['name'])
        elif name_method == 'icontains':
            qs = qs.filter(name__icontains=filters['name'])

    qs = qs.order_by('name').distinct()[:limit]

    items_list = []

    # need to use data from descriptors
    for person in qs:
        first_name = person.descriptors.get('first_name', '')
        last_name = person.descriptors.get('last_name', '')
        surname = person.descriptors.get('surname', '')

        label = ''

        if first_name and last_name:
            if surname:
                label = "%s %s (%s)" % (first_name, last_name, surname)
            else:
                label = "%s %s" % (first_name, last_name)
        elif surname:
            label = surname

        a = {
            'id': person.id,
            'label': label,
            'value': person.id
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


@RestPerson.def_auth_request(Method.POST, Format.JSON, content={
    "type": "object",
    "properties": {
        # "first_name": Person.NAME_VALIDATOR,
        # "last_name": Person.NAME_VALIDATOR,
        # "surname": Person.NAME_VALIDATOR,
        "establishment": {"type": "number"},
        "descriptors": {"type": "object"}
    },
}, perms={
    'organisation.add_person': _('You are not allowed to create a person/contact'),
    'organisation.change_establishment': _('You are not allowed to modify an establishment')
})
def create_person(request):
    """
    Create a new person.
    """
    descriptors = request.data['descriptors']
    est_id = request.data['establishment']

    # check existence of the establishment
    establishment = get_object_or_404(Establishment, id=int(est_id))

    content_type = get_object_or_404(ContentType, app_label="organisation", model="person")
    layout = get_object_or_404(Layout, name="person", target=content_type)

    person = None

    # @todo what about first_name... (how to

    try:
        with transaction.atomic():
            # common properties
            person = Person()
            person.layout = layout
            person.establishment = establishment

            # descriptors
            descriptors_builder = DescriptorsBuilder(person)

            descriptors_builder.check_and_update(layout, descriptors)
            person.descriptors = descriptors_builder.descriptors

            person.save()

            # update owner on external descriptors
            descriptors_builder.update_associations()
    except IntegrityError as e:
        Descriptor.integrity_except(Person, e)

    response = {
        'id': person.id,
        'establishment': establishment.id,
        'layout': layout.id,
        'descriptors': person.descriptors
    }

    return HttpResponseRest(request, response)


@RestPersonId.def_auth_request(Method.GET, Format.JSON)
def get_person_details(request, per_id):
    person = Person.objects.get(id=int(per_id))

    result = {
        'id': person.id,
        'establishment': person.establishment_id,
        'layout': person.layout_id,
        'descriptors': person.descriptors
    }

    return HttpResponseRest(request, result)


@RestPersonId.def_auth_request(Method.PATCH, Format.JSON, content={
        "type": "object",
        "properties": {
            "name": Establishment.NAME_VALIDATOR_OPTIONAL,
            "entity_status": Establishment.ENTITY_STATUS_VALIDATOR_OPTIONAL,
            "descriptors": {"type": "object", "required": False},
        },
    },
    perms={
        'organisation.change_establishment': _("You are not allowed to modify an establishment"),
    })
def patch_establishment(request, est_id):
    establishment = get_object_or_404(Establishment, id=int(est_id))

    organisation_name = request.data.get("name")
    entity_status = request.data.get("entity_status")
    descriptors = request.data.get("descriptors")

    result = {
        'id': establishment.id
    }

    try:
        with transaction.atomic():
            if organisation_name is not None:
                establishment.name = organisation_name
                result['name'] = organisation_name

                establishment.update_field('name')

            if entity_status is not None and establishment.entity_status != entity_status:
                establishment.set_status(entity_status)
                result['entity_status'] = entity_status

            if descriptors is not None:
                # update descriptors
                descriptors_builder = DescriptorsBuilder(establishment)

                descriptors_builder.check_and_update(establishment.layout, descriptors)

                establishment.descriptors = descriptors_builder.descriptors
                result['descriptors'] = establishment.descriptors

                descriptors_builder.update_associations()

                establishment.update_descriptors(descriptors_builder.changed_descriptors())
                establishment.update_field('descriptors')

            establishment.save()
    except IntegrityError as e:
        Descriptor.integrity_except(Organisation, e)

    return HttpResponseRest(request, result)


@RestPersonId.def_auth_request(Method.DELETE, Format.JSON, perms={
    'organisation.delete_person': _("You are not allowed to delete a person/contact"),
})
def delete_person(request, per_id):
    person = get_object_or_404(Person, id=int(per_id))

    person.delete()

    return HttpResponseRest(request, {})
