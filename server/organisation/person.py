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

from apps.descriptor.comment import CommentController
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


class RestPersonIdComment(RestPersonId):
    regex = r'^comment/$'
    suffix = 'comment'


class RestPersonIdCommentId(RestPersonIdComment):
    regex = r'^(?P<com_id>[a-zA-Z0-9]{8}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{12})/$'
    suffix = 'id'


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
            'code': person.code,
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
        cursor_code, cursor_id = cursor
        qs = Person.objects.filter(Q(code__gt=cursor_code))
    else:
        qs = Person.objects.all()

    if 'code' in filters['fields']:
        code_method = filters.get('method', 'ieq')

        if code_method == 'ieq':
            qs = qs.filter(code__iexact=filters['code'])
        elif code_method == 'icontains':
            qs = qs.filter(code__icontains=filters['code'])

    qs = qs.order_by('code').distinct()[:limit]

    items_list = []

    # need to use data from descriptors
    for person in qs:
        first_name = person.descriptors.get('first_name', '')
        last_name = person.descriptors.get('last_name', '')

        if first_name and last_name:
            label = "%s %s (%s)" % (first_name, last_name, person.code)
        else:
            label = person.code

        a = {
            'id': person.id,
            'label': label,
            'value': person.code
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
        "code": Person.CODE_VALIDATOR,
        "establishment": {"type": "number"},
        "descriptors": {"type": "object"}
    },
}, perms={
    'organisation.add_person': _('You are not allowed to create a person/contact'),
    'organisation.change_establishment': _('You are not allowed to modify an establishment'),
    'organisation.change_organisation': _("You are not allowed to modify an organisation"),
})
def create_person(request):
    """
    Create a new person.
    """
    descriptors = request.data['descriptors']
    est_id = request.data['establishment']
    code = request.data['code']

    # check existence of the establishment
    establishment = get_object_or_404(Establishment, id=int(est_id))

    content_type = get_object_or_404(ContentType, app_label="organisation", model="person")
    layout = get_object_or_404(Layout, name="person", target=content_type)

    person = None

    try:
        with transaction.atomic():
            # common properties
            person = Person()
            person.code = code
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
        'code': person.code,
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
        'code': person.code,
        'establishment': person.establishment_id,
        'layout': person.layout_id,
        'descriptors': person.descriptors
    }

    return HttpResponseRest(request, result)


@RestPersonId.def_auth_request(Method.PATCH, Format.JSON, content={
        "type": "object",
        "properties": {
            "code": Person.CODE_VALIDATOR_OPTIONAL,
            "entity_status": Person.ENTITY_STATUS_VALIDATOR_OPTIONAL,
            "descriptors": {"type": "object", "required": False}
        },
    }, perms={
        'organisation.change_person': _("You are not allowed to modify a person/contact"),
        'organisation.change_establishment': _("You are not allowed to modify an establishment"),
        'organisation.change_organisation': _("You are not allowed to modify an organisation")
    })
def patch_person(request, per_id):
    person = get_object_or_404(Person, id=int(per_id))

    person_code = request.data.get("code")
    entity_status = request.data.get("entity_status")
    descriptors = request.data.get("descriptors")

    result = {
        'id': person.id
    }

    try:
        with transaction.atomic():
            if person_code is not None:
                person.code = person_code
                result['code'] = person_code

                person.update_field('code')

            if entity_status is not None and person.entity_status != entity_status:
                person.set_status(entity_status)
                result['entity_status'] = entity_status

            if descriptors is not None:
                # update descriptors
                descriptors_builder = DescriptorsBuilder(person)

                descriptors_builder.check_and_update(person.layout, descriptors)

                person.descriptors = descriptors_builder.descriptors
                result['descriptors'] = person.descriptors

                descriptors_builder.update_associations()

                person.update_descriptors(descriptors_builder.changed_descriptors())
                person.update_field('descriptors')

            person.save()
    except IntegrityError as e:
        Descriptor.integrity_except(Person, e)

    return HttpResponseRest(request, result)


@RestPersonId.def_auth_request(Method.DELETE, Format.JSON, perms={
    'organisation.delete_person': _("You are not allowed to delete a person/contact"),
    'organisation.change_establishment': _("You are not allowed to modify an establishment"),
    'organisation.change_organisation': _("You are not allowed to modify an organisation"),
})
def delete_person(request, per_id):
    person = get_object_or_404(Person, id=int(per_id))

    person.delete()

    return HttpResponseRest(request, {})


@RestPersonIdComment.def_auth_request(Method.GET, Format.JSON, perms={
    'organisation.get_person': _("You are not allowed to get a person"),
})
def get_person_comment_list(request, per_id):
    sort_by = json.loads(request.GET.get('sort_by', '[]'))

    if not len(sort_by) or sort_by[-1] not in ('id', '+id', '-id'):
        order_by = sort_by + ['id']
    else:
        order_by = sort_by

    person = get_object_or_404(Person, id=int(per_id))

    comment_controller = CommentController(person)
    results = comment_controller.list_comments(order_by)

    return HttpResponseRest(request, results)


@RestPersonIdCommentId.def_auth_request(Method.DELETE, Format.JSON, perms={
    'organisation.change_person': _("You are not allowed to modify a person")
})
def remove_person_comment(request, per_id, com_id):
    person = get_object_or_404(Person, id=int(per_id))

    comment_controller = CommentController(person)
    comment_controller.remove_comment(com_id)

    return HttpResponseRest(request, {})


@RestPersonIdComment.def_auth_request(Method.POST, Format.JSON, content=Person.COMMENT_VALIDATOR, perms={
    'organisation.change_person': _("You are not allowed to modify a person")
})
def add_person_comment(request, per_id):
    person = get_object_or_404(Person, id=int(per_id))

    comment_controller = CommentController(person)
    result = comment_controller.add_comment(request.data['label'], request.data['value'])

    return HttpResponseRest(request, result)


@RestPersonIdCommentId.def_auth_request(Method.PATCH, Format.JSON, content=Person.COMMENT_VALIDATOR, perms={
    'organisation.change_person': _("You are not allowed to modify a person")
})
def patch_person_comment(request, per_id, com_id):
    person = get_object_or_404(Person, id=int(per_id))

    comment_controller = CommentController(person)
    result = comment_controller.update_comment(com_id, request.data['label'], request.data['value'])

    return HttpResponseRest(request, result)
