# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
Rest handlers.
"""
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import SuspiciousOperation

from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest

from .main import RestMain


class RestMainEntity(RestMain):
    regex = r'^entity/$'
    suffix = 'entity'


class RestMainEntitySearch(RestMainEntity):
    regex = r'^search/$'
    suffix = 'search'


@RestMainEntity.def_auth_request(Method.GET, Format.JSON, parameters=('app_label', 'model', 'object_id'))
def get_entity(request):
    """
    Retrieve an entity (generic details) from an app_label, model and object identifier.
    In others words from its content type and its uniquer identifier.
    """
    app_label = request.GET['app_label']
    model = request.GET['model']
    object_id = int(request.GET['object_id'])

    if app_label and model and object_id:
        content_type = ContentType.objects.get_by_natural_key(app_label, model)
        entity = content_type.get_object_for_this_type(id=object_id)

    results = {
        'id': entity.id,
        'uuid': str(entity.uuid),
        'name': entity.name,
        'content_type': "%s.%s" % (app_label, model),
        'created_date': entity.created_date,
        'modified_date': entity.modified_date,
        'entity_status': entity.entity_status
    }

    return HttpResponseRest(request, results)


@RestMainEntitySearch.def_auth_request(Method.GET, Format.JSON, parameters=('filters',))
def search_entity(request):
    """
    Search for entities according to a specific app_label, model and partial entity name,
    or by its UUID (not implemented).
    """
    filters = json.loads(request.GET['filters'])
    page = int_arg(request.GET.get('page', 1))

    app_label = filters.get('app_label')
    model = filters.get('model')
    object_name = filters.get('object_name')
    uuid = filters.get('uuid')

    entities = None

    if uuid:
        entities = None
        raise SuspiciousOperation("Not yet implemented")
    if app_label and model and object_name:
        content_type = ContentType.objects.get_by_natural_key(app_label, model)
        entities = content_type.get_all_objects_for_this_type(name__icontains=object_name)

    entities_list = []

    for entity in entities:
        entities_list.append({
            'id': entity.id,
            'content_type': entity.content_type,
            'name': entity.name,
            'uuid': entity.uuid
        })

    results = {
        'perms': [],
        'items': entities_list
    }

    return HttpResponseRest(request, results)
