# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
Views related to the home page.
"""
from django.contrib import messages
from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest
from .models import Languages, SynonymType

from django.utils.translation import ugettext_lazy as _


# for single app page with html5 navigation
class RestApp(RestHandler):
    regex = r'^app/(?P<path>\S+?)/$'
    name = 'home'


class RestHome(RestHandler):
    regex = r'^$'
    name = 'home'


class RestLanguage(RestHandler):
    regex = r'^language/$'
    name = 'language'


class RestSynonymType(RestHandler):
    regex = r'^synonym-type/$'
    name = 'synonym-type'


@RestHome.def_request(Method.GET, Format.HTML)
def index(request):
    """
    Render the home page
    """
    if not request.user.is_authenticated():
        if request.session.get('validated') is None:
            request.session.set_test_cookie()

            messages.add_message(
                request, messages.INFO, _('You are not authenticated.'))

            request.session['validated'] = False
        else:
            if not request.session['validated'] and request.session.test_cookie_worked():
                request.session.delete_test_cookie()
                request.session['validated'] = True
            elif not request.session['validated']:
                request.session.set_test_cookie()
                messages.add_message(
                    request, messages.WARNING, _('Please, you must enable your cookies.'))

    context = {}
    return render(request, 'main/home.html', context)


@RestApp.def_request(Method.GET, Format.HTML)
def index(request, path):
    """
    Render the home page
    """
    if not request.user.is_authenticated():
        if request.session.get('validated') is None:
            request.session.set_test_cookie()

            messages.add_message(
                request, messages.INFO, _('You are not authenticated.'))

            request.session['validated'] = False
        else:
            if not request.session['validated'] and request.session.test_cookie_worked():
                request.session.delete_test_cookie()
                request.session['validated'] = True
            elif not request.session['validated']:
                request.session.set_test_cookie()
                messages.add_message(
                    request, messages.WARNING, _('Please, you must enable your cookies.'))

    context = {'path': path + "/"}
    return render(request, 'main/home.html', context)


# TODO Django cache
@RestLanguage.def_request(Method.GET, Format.JSON)
def language(request):
    """
    Get the list of languages in JSON
    """
    languages = []

    for language in Languages:
        languages.append({"id": language.value, "value": str(language.label)})

    return HttpResponseRest(request, languages)


# TODO Django cache
@RestSynonymType.def_request(Method.GET, Format.JSON)
def synonym_type(request):
    """
    Get the list of type of synonym in JSON
    """
    synonym_types = []

    for st in SynonymType:
        synonym_types.append({"id": st.value, "value": str(st.label)})

    return HttpResponseRest(request, synonym_types)
