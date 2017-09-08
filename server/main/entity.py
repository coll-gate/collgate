# -*- coding: utf-8; -*-
#
# @file entity.py
# @brief Rest handlers.
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2016-09-01
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

from django.contrib.contenttypes.models import ContentType
from django.db.models import Q
from django.shortcuts import get_object_or_404

from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest
from .main import RestMain


class RestMainEntity(RestMain):
    regex = r'^entity/$'
    suffix = 'entity'


class RestMainEntitySearch(RestMainEntity):
    regex = r'^search/$'
    suffix = 'search'


class RestMainEntityValues(RestMainEntity):
    regex = r'^(?P<content_type_name>[a-zA-Z\.-]+)/values/$'
    suffix = 'values'


class RestMainEntityDetails(RestMainEntity):
    regex = r'^(?P<content_type_name>[a-zA-Z\.-]+)/details/$'
    suffix = 'details'


@RestMainEntity.def_auth_request(Method.GET, Format.JSON, parameters=('app_label', 'model', 'object_id'))
def get_entity(request):
    """
    Retrieve an entity (generic details) from an app_label, model and object identifier.
    In others words from its content type and its uniquer identifier.

    @note Returned name if the natural name (it can be a name field or a code, the display label...).
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
        'name': entity.natural_name(),
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
    # page = int_arg(request.GET.get('page', 1))

    app_label = filters.get('app_label')
    model = filters.get('model')
    object_name = filters.get('object_name')
    uuid = filters.get('uuid')

    entities = None

    if uuid:
        content_type = ContentType.objects.get_by_natural_key(app_label, model)
        entities = content_type.get_all_objects_for_this_type(Q(uuid__startswith=uuid))
    if app_label and model and object_name:
        content_type = ContentType.objects.get_by_natural_key(app_label, model)
        q = content_type.model_class().make_search_by_name(object_name)
        entities = content_type.model_class().objects.filter(q)

    entities_list = []

    for entity in entities:
        entities_list.append({
            'id': entity.id,
            'content_type': entity.content_type,
            'name': entity.natural_name(),
            'uuid': entity.uuid
        })

    results = {
        'perms': [],
        'items': entities_list
    }

    return HttpResponseRest(request, results)


@RestMainEntityValues.def_auth_request(Method.GET, Format.JSON, parameters=('values',))
def get_entity_values_for_content_type_name(request, content_type_name):
    app_label, model = content_type_name.split('.')
    content_type = get_object_or_404(ContentType, app_label=app_label, model=model)

    # json array
    values = json.loads(request.GET['values'])

    entities = content_type.get_all_objects_for_this_type(id__in=values)

    items = {}

    for entity in entities:
        items[entity.id] = entity.natural_name()

    results = {
        'cacheable': True,
        'validity': None,
        'items': items
    }

    return HttpResponseRest(request, results)


@RestMainEntityDetails.def_auth_request(Method.GET, Format.JSON, parameters=('values',))
def get_entity_details_for_content_type_name(request, content_type_name):
    app_label, model = content_type_name.split('.')
    content_type = get_object_or_404(ContentType, app_label=app_label, model=model)

    # json array
    values = json.loads(request.GET['values'])

    entities = content_type.get_all_objects_for_this_type(id__in=values)

    items = {}

    for entity in entities:
        items[entity.id] = entity.details()

    results = {
        'cacheable': True,
        'validity': None,
        'items': items
    }

    return HttpResponseRest(request, results)
