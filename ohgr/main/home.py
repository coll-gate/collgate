# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
Views related to the home page.
"""
from django.contrib import messages
from igdectk.rest.handler import *

from .base import RestApp

from django.utils.translation import ugettext_lazy as _


class RestHome(RestHandler):
    regex = r'^$'
    name = 'home'


@RestHome.def_request(Method.GET, Format.HTML)
def get_home(request):
    """
    Render the home page, the client manage routing to home view.
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
def get_app(request, path):
    """
    Render the home page and the client will dynamically route to the given path
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

    if not path:
        path = 'home'

    context = {'path': path + "/"}
    return render(request, 'main/home.html', context)
