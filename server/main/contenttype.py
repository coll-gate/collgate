# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
Rest handlers.
"""
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import SuspiciousOperation
from django.utils.translation import ugettext_lazy

from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest

from .main import RestMain


class RestMainContentType(RestMain):
    regex = r'^content-type/$'
    suffix = 'content-type'


@RestMainContentType.def_request(Method.GET, Format.JSON)
def get_contents_types(request):
    """
    Get the list of contents types in JSON
    """

    ignore_list = (
        'admin.',
        'audit.',
        'auth.',
        'contenttypes.',
        'guardian.',
        'main.',
        'sessions.',
        'sites.',
    )

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

    return HttpResponseRest(request, types)
