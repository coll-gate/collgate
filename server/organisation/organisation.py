# -*- coding: utf-8; -*-
#
# Copyright (c) 2017 INRA UMR1095 GDEC

"""
coll-gate organisation organisation model REST API
"""
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import SuspiciousOperation
from django.db import IntegrityError
from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils.translation import ugettext_lazy as _

from descriptor.describable import DescriptorsBuilder
from descriptor.models import DescriptorMetaModel
from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest
from organisation.models import Organisation, GRC

from .base import RestOrganisationModule


class RestOrganisation(RestOrganisationModule):
    regex = r'^organisation/$'
    name = 'organisation'


class RestOrganisationId(RestOrganisation):
    regex = r'^(?P<org_id>[0-9]+)/$'
    suffix = 'id'


class RestOrganisationSearch(RestOrganisation):
    regex = r'^search/$'
    suffix = 'search'


@RestOrganisation.def_auth_request(Method.POST, Format.JSON, content={
    "type": "object",
    "properties": {
        "name": Organisation.NAME_VALIDATOR,
        "type": Organisation.TYPE_VALIDATOR,
        "descriptors": {"type": "object"},
        "grc": {"type": "boolean"}
    },
}, perms={'organisation.add_organisation': _('You are not allowed to create an organisation')}
)
def create_organisation(request):
    """
    Create a new organisation.
    """
    name = request.data['name']
    organisation_type = request.data['type']
    descriptors = request.data['descriptors']

    # check uniqueness of the name
    if Organisation.objects.filter(name=name).exists():
        raise SuspiciousOperation(_("The name of the organisation is already used"))

    # check that type is in the values of descriptor
    if not Organisation.is_type(organisation_type):
        raise SuspiciousOperation(_("Unsupported type of organisation"))

    content_type = get_object_or_404(ContentType, app_label="organisation", model="organisation")
    dmm = get_object_or_404(DescriptorMetaModel, name="organisation", target=content_type)

    try:
        with transaction.atomic():
            # common properties
            organisation = Organisation()
            organisation.name = request.data['name']
            organisation.type = organisation_type
            organisation.descriptor_meta_model = dmm

            # descriptors
            descriptors_builder = DescriptorsBuilder(organisation)

            descriptors_builder.check_and_update(dmm, descriptors)
            organisation.descriptors = descriptors_builder.descriptors

            organisation.save()

            # update owner on external descriptors
            descriptors_builder.update_associations()

            # add to GRC as partner
            if request.data['grc'] is True:
                grc = GRC.objects.get_unique_grc()
                grc.organisations.add(organisation)

    except IntegrityError as e:
        logger.error(repr(e))
        raise SuspiciousOperation(_("Unable to create the organisation"))

    response = {
        'id': organisation.id,
        'name': organisation.name,
        'type': organisation.type,
        'grc': request.data['grc'],
        'descriptor_meta_model': dmm.id,
        'descriptors': organisation.descriptors
    }

    return HttpResponseRest(request, response)


@RestOrganisation.def_auth_request(Method.GET, Format.JSON)
def get_organisation_list(request):
    """
    List all organisations.
    """

    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = request.GET.get('cursor')
    limit = results_per_page

    if cursor:
        cursor_name, cursor_id = cursor.rsplit('/', 1)
        qs = Organisation.objects.filter(Q(name__gt=cursor_name))
    else:
        qs = Organisation.objects.all()

    if request.GET.get('filters'):
        filters = json.loads(request.GET['filters'])

        name = filters.get('name', '')
        organisation_type = filters.get('type')

        if filters.get('method', 'icontains') == 'icontains':
            qs = qs.filter(Q(name__icontains=name))
        else:
            qs = qs.filter(Q(name__iexact=name))

        if organisation_type:
            if filters.get('type_method', 'eq') == 'eq':
                qs = qs.filter(Q(type=organisation_type))
            else:
                qs = qs.exclude(Q(type=organisation_type))

    qs = qs.order_by('name')[:limit]

    items_list = []
    for organisation in qs:
        t = {
            'id': organisation.pk,
            'name': organisation.name,
            'type': organisation.type,
            'descriptors': organisation.descriptors,
            'num_establishments': organisation.establishments.count()
        }

        items_list.append(t)

    if len(items_list) > 0:
        # prev cursor (asc order)
        item = items_list[0]
        prev_cursor = "%s/%s" % (item['name'], item['id'])

        # next cursor (asc order)
        item = items_list[-1]
        next_cursor = "%s/%s" % (item['name'], item['id'])
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


@RestOrganisationSearch.def_auth_request(Method.GET, Format.JSON, ('filters',))
def search_organisation(request):
    """
    Quick search for an organisation with a exact or partial name and a rank.
    """
    filters = json.loads(request.GET['filters'])

    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = request.GET.get('cursor')
    limit = results_per_page

    if cursor:
        cursor_name, cursor_id = cursor.rsplit('/', 1)
        qs = Organisation.objects.filter(Q(name__gt=cursor_name))
    else:
        qs = Organisation.objects.all()

    if 'name' in filters['fields']:
        name_method = filters.get('method', 'ieq')

        if name_method == 'ieq':
            qs = qs.filter(name__iexact=filters['name'])
        elif name_method == 'icontains':
            qs = qs.filter(name__icontains=filters['name'])

    if 'type' in filters['fields']:
        organisation_type = int_arg(filters['type'])
        organisation_type_method = filters.get('type_method', 'eq')

        if organisation_type_method == 'eq':
            qs = qs.filter(Q(type=organisation_type))
        elif organisation_type_method == 'neq':
            qs = qs.exclude(Q(type=organisation_type))

    qs = qs.order_by('name').distinct()[:limit]

    items_list = []

    for organisation in qs:
        label = "%s (%s)" % (organisation.name, organisation.descriptors['acronym'])

        a = {
            'id': organisation.id,
            'label': label,
            'value': organisation.name
        }

        items_list.append(a)

    if len(items_list) > 0:
        # prev cursor (asc order)
        obj = items_list[0]
        prev_cursor = "%s/%i" % (obj['value'], obj['id'])

        # next cursor (asc order)
        obj = items_list[-1]
        next_cursor = "%s/%i" % (obj['value'], obj['id'])
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


@RestOrganisationId.def_auth_request(Method.PATCH, Format.JSON, content={
        "type": "object",
        "properties": {
            "type": Organisation.TYPE_VALIDATOR_OPTIONAL,
            "entity_status": Organisation.ENTITY_STATUS_VALIDATOR_OPTIONAL,
            "descriptors": {"type": "object", "required": False},
        },
    },
    perms={
        'organisation.change_organisation': _("You are not allowed to modify an organisation"),
    })
def patch_organisation(request, org_id):
    organisation = get_object_or_404(Organisation, id=int(org_id))

    organisation_type = request.data.get("organisation_type")
    entity_status = request.data.get("entity_status")
    descriptors = request.data.get("descriptors")

    result = {
        'id': organisation.id
    }

    try:
        with transaction.atomic():
            if organisation_type is not None:
                organisation.type = organisation_type
                result['type'] = organisation_type

                organisation.update_field('type')

            if entity_status is not None and organisation.entity_status != entity_status:
                organisation.set_status(entity_status)
                result['entity_status'] = entity_status

            if descriptors is not None:
                # update descriptors
                descriptors_builder = DescriptorsBuilder(organisation)

                descriptors_builder.check_and_update(organisation.descriptor_meta_model, descriptors)

                organisation.descriptors = descriptors_builder.descriptors
                result['descriptors'] = organisation.descriptors

                descriptors_builder.update_associations()

                organisation.descriptors_diff = descriptors
                organisation.update_field('descriptors')

            organisation.save()
    except IntegrityError as e:
        logger.error(repr(e))
        raise SuspiciousOperation(_("Unable to update the organisation"))

    return HttpResponseRest(request, result)


@RestOrganisationId.def_auth_request(Method.DELETE, Format.JSON, perms={
    'organisation.delete_organisation': _("You are not allowed to delete an organisation"),
})
def delete_organisation(request, org_id):
    organisation = get_object_or_404(Organisation, id=int(org_id))

    # remove the manager link if exists
    grc = GRC.objects.get_unique_grc()
    qs = grc.organisations.filter(organisation_id=org_id)

    if qs.exists():
        qs[0].delete()

    organisation.delete()

    return HttpResponseRest(request, {})
