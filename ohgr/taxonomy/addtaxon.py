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

from main.models import SynonymType, Languages

from .models import Taxon, TaxonRank, TaxonSynonym
from .base import RestTaxonomy

from .controller import Taxonomy

from django.utils.translation import ugettext_lazy as _


# class CreateTaxonForm(forms.Form):
#
#     name = forms.CharField(max_length=64, label=_("Name"))
#     level = forms.ChoiceField(choices=TaxonRank.choices(), initial=int(TaxonRank.SPECIE), label=_("Taxonomy level"))
#     parent = forms.ChoiceField(choices=lambda: [("0", _("None"))]+[(t.id, t.name) for t in Taxon.objects.filter()], initial="0", label=_("Parent"))
#
#     def clean_name(form):
#         if Taxon.objects.filter(name=form.data['name']):
#             raise ValidationError('Name already used')
#
#         return form.data['name']
#
#
# class RestTaxonCreateForm(RestForm, RestTaxonomy):
#     regex = r'^create/$'
#     suffix = 'create'
#     auth = True
#
#     form_class = CreateTaxonForm
#     form_template = 'taxonomy/createtaxon.html'
#
#     # TODO it can be interesting to defines the next url
#     # dynamically or to nothing if we uses a dialog for example
#     # or a create + create another... or any others process
#     success = '/ohgr/taxonomy/'
#
#     @classmethod
#     def valid_form(cls, request, form):
#         parent = None
#         if form.data['parent'] != "0":
#             parent = Taxon.objects.filter(id=form.data['parent'])
#             if parent:
#                 parent = parent[0]
#
#         Taxonomy.create_taxon(form.data['name'], int(form.data['level']), parent)
#         messages.info(request, 'Taxonomy successfully created')
#
#
# class AddSynonymForm(forms.Form):
#
#     name = forms.CharField(max_length=64, label=_("Name"))
#     language = forms.ChoiceField(choices=Languages.choices(), initial=str(Languages.FR), label=_("Language"))
#     type = forms.ChoiceField(choices=SynonymType.choices()[1:], initial=int(SynonymType.SYNONYM), label=_("Synonym type"))
