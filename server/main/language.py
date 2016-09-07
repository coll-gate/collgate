# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
Views related to the language type.
"""
from django.views.decorators.cache import cache_page

from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest

from .models import Languages
from .main import RestMain


class RestLanguage(RestMain):
    regex = r'^language/$'
    suffix = 'language'


@cache_page(60*60*24)
@RestLanguage.def_request(Method.GET, Format.JSON)
def language(request):
    """
    Get the list of languages in JSON
    """
    languages = []

    for language in Languages:
        languages.append({
            'id': language.value,
            'value': language.value,
            'label': str(language.label)
        })

    return HttpResponseRest(request, languages)
