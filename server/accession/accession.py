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

from descriptor.describable import check_and_defines_descriptors
from descriptor.models import DescriptorMetaModel
from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest
from main.models import Languages
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
            "descriptors": {"type": "object"},
            "language": {"type": "string", 'minLength': 2, 'maxLength': 5},
        },
    }, perms={
        'accession.add_accession': _("You are not allowed to create an accession")
    }
)
def create_accession(request):
    name = request.data['name']
    dmm_id = request.data['descriptor_meta_model']
    parent_id = request.data['parent']
    descriptors = request.data['descriptors']
    language = request.data['language']

    # check uniqueness of the name
    if AccessionSynonym.objects.filter(name=name, type='ID_001:0000001').exists():
        raise SuspiciousOperation(_("The name of the accession is already used as a primary synonym"))

    if Accession.objects.filter(name=name).exists():
        raise SuspiciousOperation(_("The name of the accession is already used"))

    if language not in [lang.value for lang in Languages]:
        raise SuspiciousOperation(_("The language is not supported"))

    content_type = get_object_or_404(ContentType, app_label="accession", model="accession")
    dmm = get_object_or_404(DescriptorMetaModel, id=dmm_id, target=content_type)

    # common properties
    accession = Accession()
    accession.name = name
    accession.descriptor_meta_model = dmm

    # parent taxon or variety
    parent = get_object_or_404(Taxon, id=parent_id)
    accession.parent = parent

    # descriptors
    accession.descriptors = check_and_defines_descriptors({}, dmm, descriptors)

    accession.save()

    # principal synonym
    primary = AccessionSynonym(name=name, type='ID_001:0000001', language=language)
    primary.save()

    accession.synonyms.add(primary)

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
    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = request.GET.get('cursor')
    limit = results_per_page

    # @todo filters
    # @todo name search based on synonyms
    accessions = Accession.objects.select_related('parent').all()[:limit]
    # synonyms = AccessionSynonym.objects.all()

    accession_list = []

    for accession in accessions:
        a = {
            'id': accession.pk,
            'name': accession.name,
            'parent': {  # @todo
                'id': accession.parent.id,
                'rank': accession.parent.rank,
                'name': accession.parent.name
            },
            'descriptors': accession.descriptors,
            'synonyms': []
        }

        for synonym in accession.synonyms.all().order_by('type', 'language'):
            a['synonyms'].append({
                'id': synonym.id,
                'name': synonym.name,
                'type': synonym.type,
                'language': synonym.language
            })

        accession_list.append(a)

    if len(accession_list) > 0:
        # prev cursor (asc order)
        entity = accession_list[0]
        prev_cursor = "%s/%s" % (entity['name'], entity['id'])

        # next cursor (asc order)
        entity = accession_list[-1]
        next_cursor = "%s/%s" % (entity['name'], entity['id'])
    else:
        prev_cursor = None
        next_cursor = None

    results = {
        'perms': [],
        'items': accession_list,
        'prev': prev_cursor,
        'cursor': cursor,
        'next': next_cursor,
    }

    return HttpResponseRest(request, results)


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
