# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
Rest handlers.
"""
from django.contrib.contenttypes.models import ContentType
from django.core.cache import cache
from django.core.exceptions import SuspiciousOperation
from django.utils.translation import ugettext_lazy
from django.views.decorators.cache import cache_page

from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest

from igdectk.module.manager import module_manager

from .main import RestMain

logger = logging.getLogger('collgate')


class RestMainContentType(RestMain):
    regex = r'^content-type/$'
    suffix = 'content-type'


@RestMainContentType.def_request(Method.GET, Format.JSON)
@cache_page(60*60*24, cache='default', key_prefix='collgate-cache')
def get_content_types(request):
    """
    Get the list of contents types in JSON
    """
    logger.debug("Cache miss for main.content-type")

    ignore_list = [
        'admin.',
        'auth.',
        'contenttypes.',
        'guardian.',
        'main.',
        'sessions.',
        'sites.',
    ]

    for module in module_manager.modules:
        if hasattr(module, 'ignored_content_types'):
            ignore_list.extend(module.ignored_content_types)

    types = []
    add = False
    for content_type in ContentType.objects.all():
        value = "%s.%s" % content_type.natural_key()
        label = content_type.model_class()._meta.verbose_name.capitalize()
        add = True
        for ignore_pattern in ignore_list:
            if value.startswith(ignore_pattern):
                add = False
                break

        if add:
            types.append({'id': content_type.id, 'value': value, 'label': label})

    types = sorted(types, key=lambda x: x['value'].split('.')[0] + '.' + x['label'])

    return HttpResponseRest(request, types)
