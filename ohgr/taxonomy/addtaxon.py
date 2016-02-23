# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
ohgr taxonomy add a taxon form view
"""
from django.contrib import messages
from django.core.exceptions import ValidationError
from django import forms

from igdectk.rest.handler import *

from .models import Taxon
from .base import RestTaxonomy


class CreateTaxonForm(forms.Form):
    name = forms.CharField(max_length=64)

    def clean_name(form):
        if Taxon.objects.filter(name=form.data['name']):
            raise ValidationError('Name already used')

        return form.data['name']


class RestTaxonCreateForm(RestForm, RestTaxonomy):
    regex = r'^create/$'
    suffix = 'create'
    auth = True

    form_class = CreateTaxonForm
    form_template = 'taxonomy/createtaxon.html'

    # TODO it can be interesting to defines the next url
    # dynamically or to nothing if we uses a dialog for example
    # or a create + create another... or any others process
    success = '/ohgr/taxonomy/'

    @classmethod
    def valid_form(cls, request, form):
        taxon = Taxon()
        taxon.name = form.data['name']

        taxon.save()

        messages.info(request, 'Taxonomy successfully created')
