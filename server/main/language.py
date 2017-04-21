# -*- coding: utf-8; -*-
#
# @file language.py
# @brief 
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2016-09-01
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

"""
Views related to the language type.
"""
from django.views.decorators.cache import cache_page

from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest

from .models import Languages, InterfaceLanguages
from .main import RestMain


class RestLanguage(RestMain):
    regex = r'^language/$'
    suffix = 'language'


class RestUI(RestMain):
    regex = r'^ui/$'
    suffix = 'ui'


class RestUILanguage(RestUI):
    regex = r'^language/$'
    suffix = 'language'


@cache_page(60*60*24)
@RestLanguage.def_request(Method.GET, Format.JSON)
def get_languages(request):
    """
    Get the list of languages for the entities in JSON
    """
    languages = []

    for language in Languages:
        languages.append({
            'id': language.value,
            'value': language.value,
            'label': str(language.label)
        })

    return HttpResponseRest(request, languages)


@cache_page(60*60*24)
@RestUILanguage.def_request(Method.GET, Format.JSON)
def get_ui_languages(request):
    """
    Get the list of languages for the UI in JSON
    """
    languages = []

    for language in InterfaceLanguages:
        languages.append({
            'id': language.value,
            'value': language.value,
            'label': str(language.label)
        })

    return HttpResponseRest(request, languages)

