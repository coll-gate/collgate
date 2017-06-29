# -*- coding: utf-8; -*-
#
# @file home.py
# @brief Views related to the home page.
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2016-09-01
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

from django.contrib import messages
from django.conf import settings
from django.shortcuts import get_object_or_404

from igdectk.rest.handler import *
from main.models import Profile

from .base import RestApp

from django.utils.translation import ugettext_lazy as _


class RestHome(RestHandler):
    regex = r'^$'
    name = 'home'


@RestApp.def_request(Method.GET, Format.HTML)
def get_app(request, path):
    """
    Render the home page and the client will dynamically route to the given path
    """
    if not path:
        path = 'home'

    context = {
        'path': path + "/",
        'profile_settings': "{}"
    }

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
    else:
        # setup profile settings into session.user.settings
        profile = get_object_or_404(Profile, user=request.user)
        context['profile_settings'] = profile.settings  # direct json

    return render(request, 'main/home.html', context)


@RestHome.def_request(Method.GET, Format.HTML)
def get_home(request):
    """
    Redirect to app/home
    """
    return redirect('/coll-gate/app/home/', permanent=True)

