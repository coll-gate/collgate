# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
Rest handlers.
"""
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import SuspiciousOperation
from django.shortcuts import get_object_or_404

from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest


# for single app page with html5 navigation
class RestApp(RestHandler):
    regex = r'^app/((?P<path>\S*)/){0,1}$'
    name = 'home'


class RestMain(RestHandler):
    regex = r'^main/$'
    name = 'main'


class RestMainEntity(RestMain):
    regex = r'^entity/$'
    suffix = 'entity'


class RestMainEntitySearch(RestMainEntity):
    regex = r'^search/$'
    suffix = 'search'


@RestMainEntitySearch.def_auth_request(Method.GET, Format.JSON, parameters=('filters',))
def search_entity(request):
    filters = json.loads(request.GET['filters'])
    page = int_arg(request.GET.get('page', 1))

    app_label = filters.get('app_label', 'main')
    model = filters.get('model', '')
    object_name = filters.get('object_name', '')
    uuid = filters.get('uuid')

    entities = None

    if uuid:
        entities = None
        raise SuspiciousOperation("Not yet implemented")
    if app_label and model and object_name:
        content_type = ContentType.objects.get_by_natural_key(app_label, model)
        print(object_name)
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
