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


class RestProfileSettings(RestProfile):
    regex = r'^settings/$'
    name = 'settings'


@RestProfileSignIn.def_request(Method.POST, Format.HTML)
def profile_sign_in(request):
    """
    Login with username and password
    """
    if request.user.is_authenticated():
        logout(request)
        return redirect('/coll-gate/')

    username = request.POST['username']
    password = request.POST['password']

    user = authenticate(username=username, password=password)
    if user:
        # check profile before attempt to login
        profile, created = Profile.objects.get_or_create(user=user, defaults={
            'pending': not user.is_superuser
        })

        # first time connection mean pending state excepted for super-users
        if created and profile.pending:
            user.is_active = False
            user.save()

        if profile.pending:
            messages.add_message(
                request, messages.INFO, _(
                    'Your account is pending for activation. Please be patient or contact an administrator.'))

        elif user.is_active:
            login(request, user)
            messages.add_message(
                request, messages.INFO, _('Successfully logged'))

            # expires in 12h
            request.session.set_expiry(12*60*60)
        else:
            messages.add_message(
                request, messages.ERROR, _(
                    'Your account is closed. Please contact an administrator to re-activate it.'))
    else:
        messages.add_message(
            request, messages.ERROR, _('Invalid username or password'))

    # messages are saved into DB and consumed by the next template rendering
    return redirect('/coll-gate/')


@RestProfileLogout.def_request(Method.POST, Format.HTML)
def profile_logout(request):
    """
    Logout
    """
    if request.user.is_authenticated():
        logout(request)
        messages.add_message(request, messages.INFO, _('Logged out'))

    return redirect('/coll-gate/')


@RestProfile.def_auth_request(Method.GET, Format.JSON)
def get_self_profile(request):
    """
    Get current session profile details
    """
    user = get_object_or_404(User, id=request.user.id)
    profile = get_object_or_404(Profile, user=user)

    result = {
        'id': user.id,
        'username': user.username,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'email': user.email,
        'is_active': user.is_active,
        'is_staff': user.is_staff,
        'is_superuser': user.is_superuser,
        'organisation': profile.organisation,
        'settings': json.loads(profile.settings)
    }

    return HttpResponseRest(request, result)


@RestProfile.def_auth_request(Method.PUT, Format.JSON, content={
    "type": "object",
    "properties": {
        "first_name": {"type": "string", 'minLength': 2, 'maxLength': 64},
        "last_name": {"type": "string", 'minLength': 2, 'maxLength': 64},
    }
})
def update_self_profile(request):
    """
    Get current session profile details
    """
    user = get_object_or_404(User, id=request.user.id)

    user.first_name = request.data['first_name']
    user.last_name = request.data['last_name']

    user.save()

    return HttpResponseRest(request, {})


@RestProfileSettings.def_auth_request(Method.PATCH, Format.JSON, content={
    "type": "object",
    "properties": {
        "name": {"type": "string", "minLength": 2, "maxLength": 64, "pattern": "^[a-zA-Z\_][a-zA-Z0-9\-\_]+$"},
        "setting": {"type": "any"}
    }
})
def update_self_settings(request):
    """
    Get current session profile details
    """
    profile = get_object_or_404(Profile, user=request.user)

    # name of the setting
    setting_name = request.data['name']

    setting = request.data['setting']

    current_settings = json.loads(profile.settings)
    current_settings[setting_name] = setting
    profile.settings = json.dumps(current_settings)

    profile.save()

    return HttpResponseRest(request, {})
