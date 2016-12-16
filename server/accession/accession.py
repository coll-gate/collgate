# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
coll-gate accession rest handler
"""
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import SuspiciousOperation
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import translation

from descriptor.models import DescriptorMetaModel
from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest
from taxonomy.models import Taxon

from .models import Accession, AccessionSynonym
from .base import RestAccession

from django.utils.translation import ugettext_lazy as _


class RestAccessionAccession(RestAccession):
    regex = r'^accession/$'
    name = 'accession'


class RestAccessionSearch(RestAccessionAccession):
    regex = r'^search/$'
    suffix = 'search'


class RestAccessionId(RestAccessionAccession):
    regex = r'^(?P<id>[0-9]+)/$'
    suffix = 'id'


class RestAccessionSynonym(RestAccessionAccession):
    regex = r'^synonym/$'
    suffix = 'synonym'


@RestAccessionAccession.def_auth_request(Method.POST, Format.JSON, content={
        "type": "object",
        "properties": {
            "name": {"type": "string", 'minLength': 3, 'maxLength': 32},
            "descriptor_meta_model": {"type": "number"},
            "parent": {"type": "number"},
            "descriptors": {"type": "object"}
        },
    }, perms={
        'accession.add_accession': _("You are not allowed to create an accession")
    }
)
def create_accession(request):
    name = request.data['name']
    dmm_id = request.data['descriptor_meta_model']
    parent_id = request.data['parent']

    # check uniqueness of the name
    if AccessionSynonym.objects.filter(name=name).exists():
        raise SuspiciousOperation(_("The name of the accession is already used in a "))

    if Accession.objects.filter(name=name).exists():
        raise SuspiciousOperation(_("The name of the accession is already used"))

    content_type = get_object_or_404(ContentType, app_label="accession", model="accession")
    dmm = get_object_or_404(DescriptorMetaModel, id=dmm_id, target=content_type)

    # common properties
    accession = Accession()
    accession.name = name

    lang = translation.get_language()

    # first name a primary synonym
    primary = AccessionSynonym(accession_id=accession.id, name=name, type='IN_001:0000001', language=lang)

    # parent taxon or variety
    parent = get_object_or_404(Taxon, id=parent_id)

    # accession.taxon = parent

    # descriptors
    descriptors = {}
    # @todo check mandatory, check fields values in describable

    accession.save()
    primary.save()

    response = {
        'id': accession.pk,
        'name': accession.name,
        'descriptor_meta_model': dmm.id,
        'parent': parent.id,
        'descriptors': descriptors
    }

    return HttpResponseRest(request, response)


@RestAccessionAccession.def_auth_request(Method.GET, Format.JSON,
    perms={
        'accession.list_accession': _("You are not allowed to list the accessions")
    }
)
def accession_list(request):
    accessions = Accession.objects.all()
    synonyms = AccessionSynonym.objects.all()

    # @todo

    response = {
        'accessions': accessions,
        'synonyms': synonyms,
    }

    return HttpResponseRest(request, response)


@RestAccessionSearch.def_auth_request(Method.GET, Format.JSON, ('filters',))
def search_accession(request):
    """
    Quick search for an accession with a exact or partial name and meta model of descriptor.
    """
    filters = json.loads(request.GET['filters'])
    page = int_arg(request.GET.get('page', 1))

    # @todo cursor (not pagination)
    qs = None

    name_method = filters.get('method', 'ieq')
    if 'meta_model' in filters['fields']:
        meta_model = int_arg(filters['meta_model'])

        if name_method == 'ieq':
            qs = AccessionSynonym.objects.filter(Q(name__iexact=filters['name']))
        elif name_method == 'icontains':
            qs = AccessionSynonym.objects.filter(Q(name__icontains=filters['name']))

        qs = qs.filter(Q(descriptor_meta_model_id=meta_model))
    elif 'name' in filters['fields']:
        if name_method == 'ieq':
            qs = AccessionSynonym.objects.filter(name__iexact=filters['name'])
        elif name_method == 'icontains':
            qs = AccessionSynonym.objects.filter(name__icontains=filters['name'])

    # qs = qs.select_related('accession_synonyms')

    # group by synonyms on labels
    accessions = {}

    for s in qs:
        for acc in s.accessions.all():
            accession = accessions.get(acc.id)
            if accession:
                accession['label'] += ', ' + s.name
            else:
                accessions[acc.id] = {'id': str(acc.id), 'label': s.name, 'value': acc.name}

    accessions_list = list(accessions.values())

    response = {
        'items': accessions_list,
        'page': page
    }

    return HttpResponseRest(request, response)
