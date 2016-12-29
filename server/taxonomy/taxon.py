# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
coll-gate taxonomy taxon rest handlers
"""
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import SuspiciousOperation
from django.db.models import Q
from django.shortcuts import get_object_or_404

from descriptor.describable import check_and_defines_descriptors
from descriptor.models import DescriptorMetaModel
from main.models import Languages
from permission.utils import get_permissions_for
from .base import RestTaxonomy

from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest
from .controller import Taxonomy
from .models import Taxon, TaxonRank, TaxonSynonym, TaxonSynonymType

from django.utils.translation import ugettext_lazy as _


class RestTaxon(RestTaxonomy):
    regex = r'^taxon/$'
    suffix = 'taxon'


class RestTaxonSearch(RestTaxon):
    regex = r'^search/$'
    suffix = 'search'


class RestTaxonId(RestTaxon):
    regex = r'^(?P<id>[0-9]+)/$'
    suffix = 'id'


class RestTaxonIdSynonym(RestTaxonId):
    regex = r'^synonym/$'
    suffix = 'synonym'


class RestTaxonIdSynonymId(RestTaxonIdSynonym):
    regex = r'^(?P<sid>[0-9]+)/$'
    suffix = 'id'


class RestTaxonSynonym(RestTaxon):
    regex = r'^synonym/$'
    suffix = 'synonym'


class RestTaxonomyRank(RestTaxonomy):
    regex = r'^rank/$'
    suffix = 'rank'


class RestTaxonIdChildren(RestTaxonId):
    regex = r'^children/$'
    suffix = 'children'


class RestTaxonIdEntities(RestTaxonId):
    regex = r'^entities/$'
    suffix = 'entities'


@RestTaxon.def_auth_request(Method.POST, Format.JSON, content={
    "type": "object",
    "properties": {
        "name": {"type": "string", 'minLength': 3, 'maxLength': 64},
        "rank": {"type": "number", 'minimum': 0, 'maximum': 100},
        "parent": {"type": "number", 'minimum': 0},
        "synonyms": {
            "type": "array",
            "items": [
                {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string", 'minLength': 3, 'maxLength': 64},
                        "language": {"type": "string", 'minLength': 2, 'maxLength': 2},
                        "type": {"type": "number"},
                    }
                }
            ]
        }
    },
}, perms={'taxonomy.add_taxon': _('You are not allowed to create a taxon')}
)
def create_taxon(request):
    """
    Create a new taxon with a primary synonym in the current language.
    The name of the taxon is generated.
    """
    taxon_params = request.data

    parent_id = int_arg(taxon_params['parent'])
    parent = None
    if parent_id > 0:
        parent = get_object_or_404(Taxon, id=parent_id)

    rank_id = int(taxon_params['rank'])
    language = taxon_params['synonyms'][0]['language']

    if language not in [lang.value for lang in Languages]:
        raise SuspiciousOperation(_("The language is not supported"))

    taxon = Taxonomy.create_taxon(
        taxon_params['name'],
        rank_id,
        parent,
        language)

    response = {
        'id': taxon.id,
        'name': taxon.name,
        'rank': taxon.rank,
        'parent': taxon.parent.id,
        'parent_list': [int(x) for x in taxon.parent_list.rstrip(',').split(',')] if taxon.parent_list else [],
        'synonyms': [],
    }

    for s in taxon.synonyms.all():
        response['synonyms'].append({
            'name': s.name,
            'type': s.type,
            'language': s.language,
        })

    return HttpResponseRest(request, response)


@RestTaxon.def_auth_request(Method.GET, Format.JSON)
def get_taxon_list(request):
    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = request.GET.get('cursor')
    limit = results_per_page

    if request.GET.get('filters'):
        filters = json.loads(request.GET['filters'])

        if cursor:
            cursor_name, cursor_id = cursor.split('/')
            qs = Taxon.objects.filter(Q(name__gt=cursor_name))
        else:
            qs = Taxon.objects

        name = filters.get('name', '')
        rank = filters.get('rank')

        if filters.get('method', 'icontains') == 'icontains':
            qs = qs.filter(Q(synonyms__name__icontains=name))
        else:
            qs = qs.filter(Q(name__iexact=name)).filter(Q(synonyms__name__iexact=name))

        if rank:
            qs = qs.filter(Q(rank=rank))

        tqs = qs.prefetch_related('synonyms').order_by('name')[:limit]
    else:
        if cursor:
            cursor_name, cursor_id = cursor.split('/')
            qs = Taxon.objects.filter(Q(name__gt=cursor_name))
        else:
            qs = Taxon.objects.all()

        tqs = qs.prefetch_related('synonyms').order_by('name')[:limit]

    taxons_list = []
    for taxon in tqs:
        t = {
            'id': taxon.pk,
            'name': taxon.name,
            'parent': taxon.parent,
            'rank': taxon.rank,
            'parent_list': [int(x) for x in taxon.parent_list.rstrip(',').split(',')] if taxon.parent_list else [],
            'synonyms': []
        }

        for synonym in taxon.synonyms.all().order_by('type', 'language'):
            t['synonyms'].append({
                'id': synonym.id,
                'name': synonym.name,
                'type': synonym.type,
                'language': synonym.language
            })

        taxons_list.append(t)

    if len(taxons_list) > 0:
        # prev cursor (asc order)
        taxon = taxons_list[0]
        prev_cursor = "%s/%s" % (taxon['name'], taxon['id'])

        # next cursor (asc order)
        taxon = taxons_list[-1]
        next_cursor = "%s/%s" % (taxon['name'], taxon['id'])
    else:
        prev_cursor = None
        next_cursor = None

    results = {
        'perms': [],
        'items': taxons_list,
        'prev': prev_cursor,
        'cursor': cursor,
        'next': next_cursor,
    }

    return HttpResponseRest(request, results)


@RestTaxonId.def_auth_request(Method.GET, Format.JSON)
def get_taxon_details_json(request, id):
    taxon = Taxon.objects.get(id=int_arg(id))

    parents = []
    next_parent = taxon.parent
    break_count = 0
    while break_count < 10 and next_parent is not None:
        parents.append({
            'id': next_parent.id,
            'name': next_parent.name,
            'rank': next_parent.rank,
            'parent': next_parent.parent_id
        })
        next_parent = next_parent.parent

    result = {
        'id': taxon.id,
        'name': taxon.name,
        'rank': taxon.rank,
        'parent': taxon.parent_id,
        'parent_list': [int(x) for x in taxon.parent_list.rstrip(',').split(',')] if taxon.parent_list else [],
        'parent_details': parents,
        'synonyms': [],
        'descriptor_meta_model': None,
        'descriptors': {},
    }

    for s in taxon.synonyms.all().order_by('type', 'language'):
        result['synonyms'].append({
            'id': s.id,
            'name': s.name,
            'type': s.type,
            'language': s.language,
        })

    return HttpResponseRest(request, result)


@RestTaxonSearch.def_auth_request(Method.GET, Format.JSON, ('filters',))
def search_taxon(request):
    """
    Quick search for a taxon with a exact or partial name and a rank.
    """
    filters = json.loads(request.GET['filters'])
    page = int_arg(request.GET.get('page', 1))

    # @todo cursor (not pagination)
    qs = None

    name_method = filters.get('method', 'ieq')

    if 'rank' in filters['fields']:
        rank = int_arg(filters['rank'])
        rank_method = filters.get('rank_method', 'lt')

        if name_method == 'ieq':
            qs = TaxonSynonym.objects.filter(Q(name__iexact=filters['name']))
        elif name_method == 'icontains':
            qs = TaxonSynonym.objects.filter(Q(name__icontains=filters['name']))

        if rank_method == 'eq':
            qs = qs.filter(Q(taxon__rank=rank))
        elif rank_method == 'lt':
            qs = qs.filter(Q(taxon__rank__lt=rank))
        elif rank_method == 'lte':
            qs = qs.filter(Q(taxon__rank__lte=rank))
        elif rank_method == 'gt':
            qs = qs.filter(Q(taxon__rank__gt=rank))
        elif rank_method == 'gte':
            qs = qs.filter(Q(taxon__rank__gte=rank))

    elif 'name' in filters['fields']:
        if name_method == 'ieq':
            qs = TaxonSynonym.objects.filter(name__iexact=filters['name'])
        elif name_method == 'icontains':
            qs = TaxonSynonym.objects.filter(name__icontains=filters['name'])

    qs = qs.select_related('taxon')

    # group by synonyms on labels
    taxons = {}

    for s in qs:
        taxon = taxons.get(s.taxon_id)
        if taxon:
            taxon['label'] += ', ' + s.name
        else:
            taxons[s.taxon_id] = {'id': str(s.taxon_id), 'label': s.name, 'value': s.taxon.name}

    taxons_list = list(taxons.values())

    response = {
        'items': taxons_list,
        'page': page
    }

    return HttpResponseRest(request, response)


@RestTaxonId.def_auth_request(
    Method.PATCH, Format.JSON, content={
        "type": "object",
        "properties": {
            "parent": {"type": ["number", "null"], 'required': False},
            "descriptor_meta_model": {"type": "integer", 'required': False},
            "descriptors": {"type": "object"}
        },
    },
    perms={
        'taxonomy.change_taxon': _("You are not allowed to modify a taxon"),
    }
)
def patch_taxon(request, id):
    tid = int(id)

    taxon = get_object_or_404(Taxon, id=tid)

    result = {}

    if 'parent' in request.data:
        if request.data['parent'] is None:
            taxon.parent = None
            taxon.parent_list = ""

            result['parent'] = None
            result['parent_list'] = []
            result['parent_details'] = []
        else:
            ptid = int(request.data['parent'])

            parent = get_object_or_404(Taxon, id=ptid)

            taxon.parent = parent

            if parent.rank >= taxon.rank:
                raise SuspiciousOperation(_("The rank of the parent must be lowest than the taxon itself"))

            # make parent list
            Taxonomy.update_parents(taxon, parent)

            parents = []
            next_parent = taxon.parent
            break_count = 0
            while break_count < 10 and next_parent is not None:
                parents.append({
                    'id': next_parent.id,
                    'name': next_parent.name,
                    'rank': next_parent.rank,
                    'parent': next_parent.parent_id
                })
                next_parent = next_parent.parent

            result['parent'] = parent.id
            result['parent_list'] = parents
            result['parent_details'] = parents

    if 'descriptor_meta_model' in request.data:
        dmm_id = request.data["descriptor_meta_model"]

        # changing of meta model erase all previous descriptors values
        if dmm_id is None:
            taxon.descriptor_meta_model = None
            taxon.descriptors = {}

            result['descriptor_meta_model'] = None
            result['descriptors'] = {}
        else:
            content_type = get_object_or_404(ContentType, app_label="taxonomy", model="taxon")
            dmm = get_object_or_404(DescriptorMetaModel, id=dmm_id, target=content_type)

            # dmm is different
            if taxon.descriptor_meta_model is None or (
                taxon.descriptor_meta_model is not None and taxon.descriptor_meta_model.id != dmm_id):

                taxon.descriptor_meta_model = dmm.id
                taxon.descriptors = {}

                result['descriptor_meta_model'] = dmm
                result['descriptors'] = {}

    if 'descriptors' in request.data:
        descriptors = request.data["descriptors"]

        # reset any values
        if descriptors is None:
            taxon.descriptors = {}
        else:
            # update descriptors
            taxon.descriptors = check_and_defines_descriptors(
                taxon.descriptors, taxon.descriptor_meta_model, descriptors)

        result['descriptors'] = taxon.descriptors

    taxon.save()

    return HttpResponseRest(request, result)


@RestTaxonId.def_auth_request(Method.DELETE, Format.JSON, perms={
    'taxonomy.delete_taxon': _("You are not allowed to remove a taxon"),
})
def delete_taxon(request, id):
    tid = int(id)
    taxon = get_object_or_404(Taxon, id=tid)

    # check if some entities uses it before remove
    if taxon.in_usage():
        raise SuspiciousOperation(_("This taxon is referred by one or more entities. It cannot be deleted."))

    # check if some accessions uses it before remove
    if taxon.children.exists():
        raise SuspiciousOperation(_("This taxon has children. It cannot be deleted."))

    taxon.delete()

    return HttpResponseRest(request, {})


@RestTaxonIdSynonym.def_auth_request(
    Method.POST, Format.JSON, content={
        "type": "object",
        "properties": {
            "type": {"type:": "number"},
            "language": {"type:": "string", 'minLength': 2, 'maxLength': 5},
            "name": {"type": "string", 'minLength': 3, 'maxLength': 32}
        },
    },
    perms={
        'taxonomy.change_taxon': _("You are not allowed to modify a taxon"),
        'taxonomy.add_taxonsynonym': _("You are not allowed to add a synonym to a taxon"),
    }
)
def taxon_add_synonym(request, id):
    taxon_id = int_arg(id)
    taxon = get_object_or_404(Taxon, id=taxon_id)

    synonym = {
        'type': int(request.data['type']),
        'name': str(request.data['name']),
        'language': str(request.data['language']),
    }

    Taxonomy.add_synonym(taxon, synonym)

    return HttpResponseRest(request, {})


@RestTaxonIdSynonymId.def_auth_request(
    Method.PUT, Format.JSON, content={
        "type": "object",
        "properties": {
            "name": {"type": "string", 'minLength': 3, 'maxLength': 32}
        },
    },
    perms={
        'taxonomy.change_taxon': _("You are not allowed to modify a taxon"),
        'taxonomy.change_taxonsynonym': _("You are not allowed to modify a synonym to a taxon"),
    }
)
def taxon_change_synonym(request, id, sid):
    tid = int(id)
    sid = int(sid)

    synonym = get_object_or_404(TaxonSynonym, Q(id=sid), Q(taxon=tid))

    name = request.data['name']

    # rename the taxon if the synonym name is the taxon name
    if synonym.taxon.name == synonym.name:
        synonym.taxon.name = name
        synonym.taxon.save()

    synonym.name = name
    synonym.save()

    result = {
        'id': synonym.id,
        'name': synonym.name
    }

    return HttpResponseRest(request, result)


@RestTaxonIdSynonymId.def_auth_request(
    Method.DELETE, Format.JSON,
    perms={
        'taxonomy.change_taxon': _("You are not allowed to modify a taxon"),
        'taxonomy.delete_taxonsynonym': _("You are not allowed to delete a synonym from a taxon"),
    }
)
def taxon_remove_synonym(request, id, sid):
    tid = int(id)
    sid = int(sid)

    synonym = get_object_or_404(TaxonSynonym, Q(id=sid), Q(taxon=tid))

    if synonym.type == TaxonSynonymType.PRIMARY.value:
        raise SuspiciousOperation(_("It is not possible to remove a primary synonym"))

    synonym.delete()

    return HttpResponseRest(request, {})


@RestTaxonomyRank.def_request(Method.GET, Format.JSON)
def rank(request):
    """
    Get the list of taxon rank in JSON
    """

    taxon_ranks = []
    for tl in TaxonRank:
        taxon_ranks.append({
            'id': tl.value,
            'value': tl.value,
            'label': str(tl.label)
        })

    return HttpResponseRest(request, taxon_ranks)


@RestTaxonIdChildren.def_auth_request(Method.GET, Format.JSON)
def get_taxon_children(request, id):
    """
    Return the list of direct children for the given taxon.
    """
    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = request.GET.get('cursor')
    limit = results_per_page

    tid = int(id)
    taxon = get_object_or_404(Taxon, id=tid)

    if cursor:
        cursor_name, cursor_id = cursor.split('/')
        qs = taxon.children.filter(Q(name__gt=cursor_name))
    else:
        qs = taxon.children.all()

    qs = qs.prefetch_related('synonyms').order_by('name')[:limit]

    children = []

    for child in qs:
        t = {
            'id': child.id,
            'name': child.name,
            'parent': child.parent_id,
            'rank': child.rank,
            'parent_list': [int(x) for x in child.parent_list.rstrip(',').split(',')] if child.parent_list else [],
            'synonyms': [],
        }

        for synonym in child.synonyms.all().order_by('type', 'language'):
            t['synonyms'].append({
                'id': synonym.id,
                'name': synonym.name,
                'type': synonym.type,
                'language': synonym.language
            })

        children.append(t)

    if len(children) > 0:
        # prev cursor (asc order)
        taxon = children[0]
        prev_cursor = "%s/%s" % (taxon['name'], taxon['id'])

        # next cursor (asc order)
        taxon = children[-1]
        next_cursor = "%s/%s" % (taxon['name'], taxon['id'])
    else:
        prev_cursor = None
        next_cursor = None

    results = {
        'perms': [],
        'items': children,
        'prev': prev_cursor,
        'cursor': cursor,
        'next': next_cursor,
    }

    return HttpResponseRest(request, results)


@RestTaxonIdEntities.def_auth_request(Method.GET, Format.JSON)
def get_taxon_entities(request, id):
    """
    Return the list of entities relating the given taxon.
    """
    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = request.GET.get('cursor')
    limit = results_per_page

    tid = int(id)
    taxon = get_object_or_404(Taxon, id=tid)

    if cursor:
        cursor_content_type, cursor_name, cursor_id = cursor.split('/')
    else:
        cursor_content_type = cursor_name = cursor_id = None

    items = []

    from django.apps import apps
    children_entities = apps.get_app_config('taxonomy').children_entities

    rest = limit

    # we do a manual union for the different set of content_type
    for entity in children_entities:
        field_name = entity._meta.model_name + '_set'

        # check _meta model type with cursor content type (grouped by content_type)
        if cursor_content_type is not None:
            if ".".join((entity._meta.app_label, entity._meta.model_name)) == cursor_content_type:
                cursor_content_type = None
            else:
                # continue with next entities set
                continue

        children = getattr(taxon, field_name)
        if children and rest > 0:
            if cursor_name:  # name is unique per type of entity
                qs = children.filter(name__gt=cursor_name)
                cursor_name = None
            else:
                qs = children.all()

            qs = qs.order_by('name')[:rest]

            # remaining slot for items that can be used for the next type of entity
            rest -= qs.count()

            for item in qs:
                t = {
                    'id': item.id,
                    'content_type': '.'.join(item.content_type.natural_key()),
                    'name': item.name
                }

                items.append(t)

        if rest == 0:
            break

    if len(items) > 0:
        # prev cursor (asc order)
        item = items[0]
        prev_cursor = "%s/%s/%s" % (item['content_type'], item['name'], item['id'])

        # next cursor (asc order)
        item = items[-1]
        next_cursor = "%s/%s/%s" % (item['content_type'], item['name'], item['id'])
    else:
        prev_cursor = None
        next_cursor = None

    results = {
        'perms': [],
        'items': items,
        'prev': prev_cursor,
        'cursor': cursor,
        'next': next_cursor,
    }

    return HttpResponseRest(request, results)
