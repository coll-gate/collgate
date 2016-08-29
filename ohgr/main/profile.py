# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
Views related to the management of the user profile.
"""

from django.contrib import messages
from django.contrib.auth import authenticate, login, logout

from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404

from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest

from .models import Profile
from .main import RestMain

from django.utils.translation import gettext_lazy as _


class RestProfile(RestMain):
    regex = r'^profile/$'
    name = 'profile'


class RestProfileSignIn(RestProfile):
    regex = r'^signin/$'
    suffix = 'signin'


class RestProfileLogout(RestProfile):
    regex = r'^logout/$'
    suffix = 'logout'


@RestProfileSignIn.def_request(Method.POST, Format.HTML)
def profile_signin(request):
    """
    Login with username and password
    """
    if request.user.is_authenticated():
        logout(request)
        return redirect('/ohgr/')

    username = request.POST['username']
    password = request.POST['password']

    user = authenticate(username=username, password=password)
    if user:
        if user.is_active:
            login(request, user)
            messages.add_message(
                request, messages.INFO, _('Successfully logged'))

            # expires in 12h
            request.session.set_expiry(12*60*60)

            # profile
            profile = Profile.objects.get_or_create(user=user)
        else:
            messages.add_message(
                request, messages.ERROR, _('Unable to login'))
    else:
        messages.add_message(
            request, messages.ERROR, _('Invalid username or password'))

    # messages are saved into DB and consumed by the next template rendering
    return redirect('/ohgr/')


@RestProfileLogout.def_request(Method.POST, Format.HTML)
def profile_logout(request):
    """
    Logout
    """
    if request.user.is_authenticated():
        logout(request)
        messages.add_message(request, messages.INFO, _('Logged out'))

    return redirect('/ohgr/')


@RestProfile.def_auth_request(Method.GET, Format.JSON)
def get_self_profile(request):
    """
    Get current session profile details
    """
    user = get_object_or_404(User, id=request.user.id)

    result = {
        'id': user.id,
        'username': user.username,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'email': user.email,
        'is_active': user.is_active,
        'is_staff': user.is_staff,
        'is_superuser': user.is_superuser
    }

    return HttpResponseRest(request, result)
