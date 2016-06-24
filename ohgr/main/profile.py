# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
Views related to the management of the user profile.
"""

from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django import forms
from django.db.models import Q

from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404

from igdectk.rest.handler import *

from .models import Profile

from django.utils.translation import gettext_noop as _


class RestProfile(RestHandler):
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
    Login with email and password
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
            request, messages.ERROR, _('Username or password'))

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


class UpdateUserForm(forms.Form):
    username = forms.CharField(
        max_length=30,
        widget=forms.TextInput(attrs={'readonly': 'readonly'}))

    email = forms.EmailField()
    first_name = forms.CharField(max_length=127)
    last_name = forms.CharField(max_length=127)
    company = forms.CharField(max_length=127)

    def clean_email(self):
        if User.objects.filter(Q(email=self.data['email']),
                               ~Q(username=self.data['username'])):
            raise ValidationError('Email already used')

        return self.data['email']


class RestProfileEditForm(RestForm, RestProfile):
    regex = r'^edit/$'
    suffix = 'edit'
    auth = True

    form_class = UpdateUserForm
    form_template = 'main/profile_edit.html'

    success = '/ohgr/'

    @classmethod
    def get(cls, request, form):
        form.initial['username'] = request.user.username
        form.initial['email'] = request.user.email
        form.initial['first_name'] = request.user.first_name
        form.initial['last_name'] = request.user.last_name

        profile = get_object_or_404(Profile, user=request.user)
        form.initial['company'] = profile.company

    @classmethod
    def valid_form(cls, request, form):
        request.user.first_name = form.data['first_name']
        request.user.last_name = form.data['last_name']
        request.user.email = form.data['email']
        request.user.save()

        profile = get_object_or_404(Profile, user=request.user)
        profile.company = form.data['company']
        profile.save()

        messages.info(request, _('User successfully updated'))
