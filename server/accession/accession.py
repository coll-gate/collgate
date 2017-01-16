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
from main.models import Languages, EntityStatus
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


class RestAccessionIdSynonym(RestAccessionId):
    regex = r'^synonym/$'
    suffix = 'synonym'


class RestAccessionIdSynonymId(RestAccessionIdSynonym):
    regex = r'^(?P<sid>[0-9]+)/$'
    suffix = 'id'


@RestAccessionAccession.def_auth_request(Method.POST, Format.JSON, content={
        "type": "object",
        "properties": {
            "name": {"type": "string", 'minLength': 3, 'maxLength': 64},
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
    if AccessionSynonym.objects.filter(name=name, type='IN_001:0000001').exists():
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
    primary = AccessionSynonym(name=name, type='IN_001:0000001', language=language)
    primary.save()

    accession.synonyms.add(primary)

    response = {
        'id': accession.pk,
        'name': accession.name,
        'descriptor_meta_model': dmm.id,
        'parent': parent.id,
        'descriptors': descriptors,
        'synonyms': [
            {
                'id': primary.id,
                'name': primary.name,
                'type': primary.type,
                'language': primary.language
            }
        ]
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
            'parent': accession.parent.id,
            'descriptor_meta_model': accession.descriptor_meta_model.id,
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


@RestAccessionId.def_auth_request(Method.GET, Format.JSON)
def get_accession_details_json(request, id):
    accession = Accession.objects.get(id=int_arg(id))

    result = {
        'id': accession.id,
        'name': accession.name,
        'parent': accession.parent.id,
        'synonyms': [],
        'descriptor_meta_model': accession.descriptor_meta_model.id,
        'descriptors': accession.descriptors
    }

    for s in accession.synonyms.all().order_by('type', 'language'):
        result['synonyms'].append({
            'id': s.id,
            'name': s.name,
            'type': s.type,
            'language': s.language,
        })

    return HttpResponseRest(request, result)


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

    # qs = qs.select_related('synonyms')

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


@RestAccessionId.def_auth_request(Method.PATCH, Format.JSON, content={
        "type": "object",
        "properties": {
            "name": {"type": "string", "minLength": 3, "maxLength": 64, "required": False},
            "parent": {"type": "integer", "required": False},
            "entity_status": {"type": "integer", "minimum": 0, "maximum": 3, "required": False},
            "descriptors": {"type": "object", "required": False},
        },
    },
    perms={
        'accession.change_accession': _("You are not allowed to modify an accession"),
    })
def patch_accession(request, id):
    acc_id = int(id)
    accession = get_object_or_404(Accession, id=acc_id)

    name = request.data.get("name")
    entity_status = request.data.get("entity_status")
    descriptors = request.data.get("descriptors")

    result = {
        'id': accession.id
    }

    if name is not None and accession.name != name:
        if AccessionSynonym.objects.filter(name=name, type='IN_001:0000001').exists():
            raise SuspiciousOperation(_("The name of the accession is already used as a primary synonym"))

        if Accession.objects.filter(name=name).exists():
            raise SuspiciousOperation(_("The name of the accession is already used"))

        accession.name = name
        result['name'] = name

    if 'parent' in request.data:
        parent = int(request.data['parent'])
        taxon = get_object_or_404(Taxon, id=parent)

        accession.parent = taxon
        result['parent'] = taxon.id

    if entity_status is not None and accession.entity_status != entity_status:
        accession.set_status(entity_status)
        result['entity_status'] = entity_status

    if descriptors is not None:
        # update descriptors
        accession.descriptors = check_and_defines_descriptors(
            accession.descriptors, accession.descriptor_meta_model, descriptors)

        result['descriptors'] = accession.descriptors

    accession.save()

    return HttpResponseRest(request, result)


@RestAccessionId.def_auth_request(Method.DELETE, Format.JSON, perms={
    'accession.delete_accession': _("You are not allowed to delete an accession"),
})
def delete_accession(request, id):
    acc_id = int(id)
    accession = get_object_or_404(Accession, id=acc_id)

    accession.synonyms.clear()
    accession.delete()

    return HttpResponseRest(request, {})


@RestAccessionIdSynonym.def_auth_request(
    Method.POST, Format.JSON, content={
        "type": "object",
        "properties": {
            "type": {"type:": "string", 'minLength': 14, 'maxLength': 14},
            "language": {"type:": "string", 'minLength': 2, 'maxLength': 5},
            "name": {"type": "string", 'minLength': 3, 'maxLength': 64}
        },
    },
    perms={
        'accession.change_accession': _("You are not allowed to modify an accession"),
        'accession.add_accessionsynonym': _("You are not allowed to add a synonym of accession"),
    }
)
def accession_add_synonym(request, id):
    aid = int_arg(id)
    accession = get_object_or_404(Accession, id=aid)

    synonym = {
        'type': int(request.data['type']),
        'name': str(request.data['name']),
        'language': str(request.data['language']),
    }

    # @todo
    # Accession.add_synonym(accession, synonym)

    return HttpResponseRest(request, {})


@RestAccessionIdSynonymId.def_auth_request(
    Method.PUT, Format.JSON, content={
        "type": "object",
        "properties": {
            "name": {"type": "string", 'minLength': 3, 'maxLength': 64}
        },
    },
    perms={
        'accession.change_accession': _("You are not allowed to modify an accession"),
        'accession.change_accessionsynonym': _("You are not allowed to modify a synonym of accession"),
    }
)
def accession_change_synonym(request, id, sid):
    aid = int(id)
    sid = int(sid)

    # @todo
    # synonym = get_object_or_404(AccessionSynonym, Q(id=sid), Q(accession=aid))

    name = request.data['name']

    # rename the taxon if the synonym name is the taxon name
    # if synonym.taxon.name == synonym.name:
    #     synonym.taxon.name = name
    #     synonym.taxon.save()

    # synonym.name = name
    # synonym.save()

    result = {
    #     'id': synonym.id,
    #     'name': synonym.name
    }

    return HttpResponseRest(request, result)


@RestAccessionIdSynonymId.def_auth_request(
    Method.DELETE, Format.JSON,
    perms={
        'accession.change_accession': _("You are not allowed to modify an accession"),
        'accession.delete_accessionsynonym': _("You are not allowed to delete a synonym of accession"),
    }
)
def accession_remove_synonym(request, id, sid):
    aid = int(id)
    sid = int(sid)

    # synonym = get_object_or_404(AccessionSynonym, Q(id=sid), Q(accession=aid))

    # if synonym.type == 'IN_001:0000001':
    #     raise SuspiciousOperation(_("It is not possible to remove a primary synonym"))

    # synonym.delete()

    return HttpResponseRest(request, {})
