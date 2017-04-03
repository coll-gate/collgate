# -*- coding: utf-8; -*-
#
# Copyright (c) 2017 INRA UMR1095 GDEC

"""
coll-gate organisation establishment model REST API
"""
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import SuspiciousOperation
from django.db import transaction, IntegrityError
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils.translation import ugettext_lazy as _

from descriptor.describable import DescriptorsBuilder
from descriptor.models import DescriptorMetaModel, DescriptorModelType
from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest
from organisation.models import Organisation, Establishment

from .base import RestOrganisationModule
from .organisation import RestOrganisationId


class RestEstablishment(RestOrganisationModule):
    regex = r'^establishment/$'
    name = 'establishment'


class RestEstablishmentId(RestEstablishment):
    regex = r'^(?P<est_id>[0-9]+)/$'
    suffix = 'id'


class RestOrganisationIdEstablishment(RestOrganisationId):
    regex = r'^establishment/$'
    suffix = 'establishment'


class RestEstablishmentSearch(RestEstablishment):
    regex = r'^search/$'
    suffix = 'search'


@RestOrganisationIdEstablishment.def_auth_request(Method.GET, Format.JSON)
def get_establishment_list_for_organisation(request, org_id):
    """
    List all establishments for a specific organisation.
    """
    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = request.GET.get('cursor')
    limit = results_per_page

    filters = request.GET.get('filters')

    if filters:
        filters = json.loads(filters)

    organisation = get_object_or_404(Organisation, id=int(org_id))

    if cursor:
        cursor_name, cursor_id = cursor.rsplit('/', 1)
        qs = organisation.establishments.filter(Q(name__gt=cursor_name))
    else:
        qs = organisation.establishments.all()

    if filters:
        name = filters.get('name')
        name_code = filters.get('name_code')
        name_method = filters.get('method', 'ieq')

        if name:
            if name_method == 'icontains':
                qs = qs.filter(Q(name__icontains=name))
            elif name_method == 'ieq':
                qs = qs.filter(Q(name__iexact=name))

        if name_code:
            if name_method == 'icontains':
                qs = qs.filter(Q(name__icontains=name_code) | Q(descriptors__establishment_code=name_code))
            elif name_method == 'ieq':
                qs = qs.filter(Q(name__iexact=name_code) | Q(descriptors__establishment_code=name_code))

    qs = qs.select_related("organisation").order_by('name')[:limit]

    items_list = []
    for establishment in qs:
        t = {
            'id': establishment.pk,
            'name': establishment.name,
            'descriptors': establishment.descriptors,
            'descriptor_meta_model': establishment.descriptor_meta_model,
            'organisation': establishment.organisation_id,
            'organisation_details': {
                'id': establishment.organisation.id,
                'name': establishment.organisation.name
            }
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


@RestEstablishmentSearch.def_auth_request(Method.GET, Format.JSON, ('filters',))
def search_establishment(request):
    """
    Quick search for an establishment with a exact or partial name.
    """
    filters = json.loads(request.GET['filters'])

    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = request.GET.get('cursor')
    limit = results_per_page

    if cursor:
        cursor_name, cursor_id = cursor.rsplit('/', 1)
        qs = Establishment.objects.filter(Q(name__gt=cursor_name))
    else:
        qs = Establishment.objects.all()

    if 'name' in filters['fields']:
        name_method = filters.get('method', 'ieq')

        if name_method == 'ieq':
            qs = qs.filter(name__iexact=filters['name'])
        elif name_method == 'icontains':
            qs = qs.filter(name__icontains=filters['name'])

    qs = qs.order_by('name').distinct()[:limit]

    items_list = []

    for establishment in qs:
        label = "%s (%s)" % (establishment.name, establishment.descriptors['establishment_code'])

        a = {
            'id': establishment.id,
            'label': label,
            'value': establishment.name
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


@RestEstablishment.def_auth_request(Method.POST, Format.JSON, content={
    "type": "object",
    "properties": {
        "name": Establishment.NAME_VALIDATOR,
        "organisation": {"type": "number"},
        "descriptors": {"type": "object"}
    },
}, perms={
    'organisation.change_organisation': _('You are not allowed to modify an organisation'),
    'organisation.add_establishment': _('You are not allowed to create an establishment')
})
def create_establishment(request):
    """
    Create a new establishment.
    """
    name = request.data['name']
    descriptors = request.data['descriptors']
    org_id = request.data['organisation']

    # check existence of the organisation
    organisation = get_object_or_404(Organisation, id=int(org_id))

    # check uniqueness of the name
    if Establishment.objects.filter(name=name).exists():
        raise SuspiciousOperation(_("The name of the establishment is already used"))

    content_type = get_object_or_404(ContentType, app_label="organisation", model="establishment")
    dmm = get_object_or_404(DescriptorMetaModel, name="establishment", target=content_type)

    try:
        with transaction.atomic():
            # common properties
            establishment = Establishment()
            establishment.name = request.data['name']
            establishment.descriptor_meta_model = dmm
            establishment.organisation = organisation

            # descriptors
            descriptors_builder = DescriptorsBuilder(organisation)

            descriptors_builder.check_and_update(dmm, descriptors)
            establishment.descriptors = descriptors_builder.descriptors

            establishment.save()

            # update owner on external descriptors
            descriptors_builder.update_associations()
    except IntegrityError as e:
        DescriptorModelType.integrity_except(Organisation, e)

    response = {
        'id': establishment.id,
        'name': establishment.name,
        'organisation': organisation.id,
        'descriptor_meta_model': dmm.id,
        'descriptors': establishment.descriptors
    }

    return HttpResponseRest(request, response)


@RestEstablishmentId.def_auth_request(Method.GET, Format.JSON)
def get_establishment_details(request, est_id):
    establishment = Establishment.objects.get(id=int(est_id))

    result = {
        'id': establishment.id,
        'name': establishment.name,
        'organisation': establishment.organisation_id,
        'descriptor_meta_model': establishment.descriptor_meta_model_id,
        'descriptors': establishment.descriptors
    }

    return HttpResponseRest(request, result)


@RestEstablishmentId.def_auth_request(Method.PATCH, Format.JSON, content={
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

                descriptors_builder.check_and_update(establishment.descriptor_meta_model, descriptors)

                establishment.descriptors = descriptors_builder.descriptors
                result['descriptors'] = establishment.descriptors

                descriptors_builder.update_associations()

                establishment.descriptors_diff = descriptors
                establishment.update_field('descriptors')

            establishment.save()
    except IntegrityError as e:
        DescriptorModelType.integrity_except(Organisation, e)

    return HttpResponseRest(request, result)


@RestEstablishmentId.def_auth_request(Method.DELETE, Format.JSON, perms={
    'organisation.delete_establishment': _("You are not allowed to delete an establishment"),
})
def delete_establishment(request, est_id):
    establishment = get_object_or_404(Establishment, id=int(est_id))

    establishment.delete()

    return HttpResponseRest(request, {})
