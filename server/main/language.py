# -*- coding: utf-8; -*-
#
# @file language.py
# @brief Views related to the language type.
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2016-09-01
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details

from django.core.exceptions import SuspiciousOperation
from django.shortcuts import get_object_or_404
from django.utils import translation
from django.utils.translation import ugettext_lazy as _

from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest

from main.cache import cache_manager
from messenger.cache import client_cache_manager

from .models import InterfaceLanguages, Language
from .main import RestMain


class RestLanguage(RestMain):
    regex = r'^language/$'
    suffix = 'language'


class RestLanguageCode(RestLanguage):
    regex = r'^(?P<code>[a-zA-Z]{2}([_-][a-zA-Z]{2})*)/$'
    suffix = 'code'


class RestLanguageCodeLabel(RestLanguageCode):
    regex = r'^label/$'
    suffix = 'label'


class RestUI(RestMain):
    regex = r'^ui/$'
    suffix = 'ui'


class RestUILanguage(RestUI):
    regex = r'^language/$'
    suffix = 'language'


@RestLanguage.def_request(Method.GET, Format.JSON)
def get_languages(request):
    """
    Get the list of languages for the entities in JSON
    """
    lang = translation.get_language()
    cache_name = 'languages:%s' % lang

    languages = cache_manager.get('main', cache_name)

    if languages:
        return HttpResponseRest(request, languages)

    languages = []

    for language in Language.objects.all().order_by('code'):
        languages.append({
            'id': language.code,
            'value': language.code,
            'label': language.get_label()
        })

    # cache for 24h
    cache_manager.set('main', cache_name, languages, 60*60*24)

    return HttpResponseRest(request, languages)


@RestLanguage.def_admin_request(Method.POST, Format.JSON, content={
        "type": "object",
        "properties": {
            "code": Language.CODE_VALIDATOR,
            "label": Language.LABEL_VALIDATOR
        },
    },
    staff=True
)
def post_language(request):
    """
    Create an new language for data.
    """
    code = request.data['code']
    label = request.data['label']

    lang = translation.get_language()

    language = Language()
    language.code = code
    language.set_label(lang, request.data['label'])
    language.save()

    results = {
        'id': code,
        'value': code,
        'label': label
    }

    return HttpResponseRest(request, results)


@RestLanguageCode.def_admin_request(Method.DELETE, Format.JSON, staff=True)
def delete_language(request, code):
    language = get_object_or_404(Language, code=code)

    # do we allow delete because of data consistency ?
    # it is not really a problem because the code is a standard
    language.delete()

    return HttpResponseRest(request, {})


@RestLanguageCodeLabel.def_auth_request(Method.GET, Format.JSON)
def get_all_labels_of_language(request, code):
    """
    Returns labels for each language related to the user interface.
    """
    language = get_object_or_404(Language, code=code)

    label_dict = language.label

    # complete with missing languages
    for lang, lang_label in InterfaceLanguages.choices():
        if lang not in label_dict:
            label_dict[lang] = ""

    results = label_dict

    return HttpResponseRest(request, results)


@RestLanguageCodeLabel.def_admin_request(Method.PUT, Format.JSON, content={
        "type": "object",
        "additionalProperties": Language.LABEL_VALIDATOR
    },
    staff=True)
def change_language_labels(request, code):
    language = get_object_or_404(Language, code=code)

    labels = request.data
    languages_values = [lang[0] for lang in InterfaceLanguages.choices()]

    for lang, label in labels.items():
        if lang not in languages_values:
            raise SuspiciousOperation(_("Unsupported language identifier"))

    language.label = labels
    language.save()

    result = {
        'label': language.get_label()
    }

    return HttpResponseRest(request, result)


@RestUILanguage.def_request(Method.GET, Format.JSON)
def get_ui_languages(request):
    """
    Get the list of languages for the UI in JSON
    """
    lang = translation.get_language()
    cache_name = 'ui-languages:%s' % lang

    results = cache_manager.get('main', cache_name)

    if results:
        return results

    languages = []

    for language in InterfaceLanguages:
        languages.append({
            'id': language.value,
            'value': language.value,
            'label': str(language.label)
        })

    # cache for 24h
    cache_manager.set('main', cache_name, results, 60*60*24)

    return HttpResponseRest(request, languages)
