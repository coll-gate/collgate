# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
coll-gate taxonomy taxon rest handlers
"""

from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import SuspiciousOperation
from django.db import IntegrityError
from django.db import transaction
from django.db.models import Prefetch
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils.translation import ugettext_lazy as _

from descriptor.describable import DescriptorsBuilder
from descriptor.models import DescriptorMetaModel
from main.models import Languages
from permission.utils import get_permissions_for

from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest

from .controller import Taxonomy
from .models import Taxon, TaxonRank, TaxonSynonym, TaxonSynonymType
from .base import RestTaxonomy


class RestTaxon(RestTaxonomy):
    regex = r'^taxon/$'
    suffix = 'taxon'


class RestTaxonSearch(RestTaxon):
    regex = r'^search/$'
    suffix = 'search'


class RestTaxonId(RestTaxon):
    regex = r'^(?P<tax_id>[0-9]+)/$'
    suffix = 'id'


class RestTaxonIdSynonym(RestTaxonId):
    regex = r'^synonym/$'
    suffix = 'synonym'


class RestTaxonIdSynonymId(RestTaxonIdSynonym):
    regex = r'^(?P<syn_id>[0-9]+)/$'
    suffix = 'id'


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
        "name": TaxonSynonym.NAME_VALIDATOR,
        "rank": Taxon.RANK_VALIDATOR,
        "parent": {"type": "number", 'minimum': 0},
        "synonyms": {
            "type": "array",
            "items": [
                {
                    "type": "object",
                    "properties": {
                        "name": TaxonSynonym.NAME_VALIDATOR,
                        "language": TaxonSynonym.LANGUAGE_VALIDATOR,
                        "type": {"type": "number"}
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

    parent_id = int(taxon_params['parent'])
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
        'descriptor_meta_model': None,
        'descriptors': {}
    }

    for s in taxon.synonyms.all():
        response['synonyms'].append({
            'id': s.id,
            'name': s.synonym,
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
            cursor_name, cursor_id = cursor.rsplit('/', 1)
            qs = Taxon.objects.filter(Q(name__gt=cursor_name))
        else:
            qs = Taxon.objects.all()

        name = filters.get('name', '')
        rank = filters.get('rank')

        # name search based on synonyms
        if filters.get('method', 'icontains') == 'icontains':
            qs = qs.filter(Q(synonyms__synonym__icontains=name))
        else:
            qs = qs.filter(Q(name__iexact=name)).filter(Q(synonyms__synonym__iexact=name))

        if rank:
            qs = qs.filter(Q(rank=rank))
    else:
        if cursor:
            cursor_name, cursor_id = cursor.rsplit('/', 1)
            qs = Taxon.objects.filter(Q(name__gt=cursor_name))
        else:
            qs = Taxon.objects.all()

    qs = qs.prefetch_related(
        Prefetch(
            "synonyms",
            queryset=TaxonSynonym.objects.all().order_by('type', 'language'))
    ).order_by('name')[:limit]

    items_list = []
    for taxon in qs:
        t = {
            'id': taxon.pk,
            'name': taxon.name,
            'parent': taxon.parent_id,
            'rank': taxon.rank,
            'parent_list': [int(x) for x in taxon.parent_list.rstrip(',').split(',')] if taxon.parent_list else [],
            'synonyms': []
        }

        for synonym in taxon.synonyms.all():
            t['synonyms'].append({
                'id': synonym.id,
                'name': synonym.synonym,
                'type': synonym.type,
                'language': synonym.language
            })

            items_list.append(t)

    if len(items_list) > 0:
        # prev cursor (asc order)
        taxon = items_list[0]
        prev_cursor = "%s/%s" % (taxon['name'], taxon['id'])

        # next cursor (asc order)
        taxon = items_list[-1]
        next_cursor = "%s/%s" % (taxon['name'], taxon['id'])
    else:
        prev_cursor = None
        next_cursor = None

    results = {
        'perms': [],
        'items': items_list,
        'prev': prev_cursor,
        'cursor': cursor,
        'next': next_cursor,
    }

    return HttpResponseRest(request, results)


@RestTaxonId.def_auth_request(Method.GET, Format.JSON)
def get_taxon_details_json(request, tax_id):
    taxon = Taxon.objects.get(id=int(tax_id))

    # query for parents
    parents = []
    parents_taxon = Taxon.objects.filter(id__in=[int(x) for x in taxon.parent_list.split(',') if x != ''])

    for parent in parents_taxon:
        parents.insert(0, {
            'id': parent.id,
            'name': parent.name,
            'rank': parent.rank,
            'parent': parent.parent_id
        })

    result = {
        'id': taxon.id,
        'name': taxon.name,
        'rank': taxon.rank,
        'parent': taxon.parent_id,
        'parent_list': [int(x) for x in taxon.parent_list.rstrip(',').split(',')] if taxon.parent_list else [],
        'parent_details': parents,
        'synonyms': [],
        'descriptor_meta_model': taxon.descriptor_meta_model_id,
        'descriptors': taxon.descriptors,
    }

    for s in taxon.synonyms.all().order_by('type', 'language'):
        result['synonyms'].append({
            'id': s.id,
            'name': s.synonym,
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

    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = request.GET.get('cursor')
    limit = results_per_page

    if cursor:
        cursor_name, cursor_id = cursor.rsplit('/', 1)
        qs = Taxon.objects.filter(Q(name__gt=cursor_name))
    else:
        qs = Taxon.objects.all()

    if 'name' in filters['fields']:
        name_method = filters.get('method', 'ieq')

        if name_method == 'ieq':
            qs = qs.filter(synonyms__synonym__iexact=filters['name'])
        elif name_method == 'icontains':
            qs = qs.filter(synonyms__synonym__icontains=filters['name'])

    if 'rank' in filters['fields']:
        rank = int_arg(filters['rank'])
        rank_method = filters.get('rank_method', 'lt')

        if rank_method == 'eq':
            qs = qs.filter(Q(rank=rank))
        elif rank_method == 'lt':
            qs = qs.filter(Q(rank__lt=rank))
        elif rank_method == 'lte':
            qs = qs.filter(Q(rank__lte=rank))
        elif rank_method == 'gt':
            qs = qs.filter(Q(rank__gt=rank))
        elif rank_method == 'gte':
            qs = qs.filter(Q(rank__gte=rank))

    qs = qs.prefetch_related(
        Prefetch(
            "synonyms",
            queryset=TaxonSynonym.objects.exclude(type=TaxonSynonymType.PRIMARY.value).order_by('type', 'language'))
    )

    qs = qs.order_by('name').distinct()[:limit]

    items_list = []

    for taxon in qs:
        label = taxon.name

        for synonym in taxon.synonyms.all():
            label += ', ' + synonym.synonym

        a = {
            'id': taxon.id,
            'label': label,
            'value': taxon.name
        }

        items_list.append(a)

    if len(items_list) > 0:
        # prev cursor (asc order)
        obj = items_list[0]
        prev_cursor = "%s/%i" % (obj['value'], obj['id'])

        # next cursor (asc order)
        obj = items_list[-1]
        next_cursor = "%s/%i" % (obj['value'], obj['id'])
    else:
        prev_cursor = None
        next_cursor = None

    results = {
        'perms': [],
        'items': items_list,
        'prev': prev_cursor,
        'cursor': cursor,
        'next': next_cursor,
    }

    return HttpResponseRest(request, results)


@RestTaxonId.def_auth_request(
    Method.PATCH, Format.JSON, content={
        "type": "object",
        "properties": {
            "parent": {"type": ["number", "null"], 'required': False},
            "descriptor_meta_model": {"type": ["integer", "null"], 'required': False},
            "descriptors": {"type": "object", 'required': False}
        },
    },
    perms={
        'taxonomy.change_taxon': _("You are not allowed to modify a taxon"),
    }
)
def patch_taxon(request, tax_id):
    taxon = get_object_or_404(Taxon, id=int(tax_id))

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

            # query for parents
            parents = []
            parents_taxon = Taxon.objects.filter(id__in=[int(x) for x in taxon.parent_list.split(',') if x != ''])

            for parent in parents_taxon:
                parents.insert(0, {
                    'id': parent.id,
                    'name': parent.name,
                    'rank': parent.rank,
                    'parent': parent.parent_id
                })

            result['parent'] = parent.id
            result['parent_list'] = parents
            result['parent_details'] = parents

        taxon.update_field(['parent', 'parent_list'])

    try:
        with transaction.atomic():
            # update meta-model of descriptors and descriptors
            if 'descriptor_meta_model' in request.data:
                dmm_id = request.data["descriptor_meta_model"]

                # changing of meta model erase all previous descriptors values
                if dmm_id is None and taxon.descriptor_meta_model is not None:
                    # clean previous descriptors and owns
                    descriptors_builder = DescriptorsBuilder(taxon)

                    descriptors_builder.clear(taxon.descriptor_meta_model)

                    taxon.descriptor_meta_model = None
                    taxon.descriptors = {}

                    descriptors_builder.update_associations()

                    result['descriptor_meta_model'] = None
                    result['descriptors'] = {}

                elif dmm_id is not None:
                    # existing descriptors and new meta-model is different : first clean previous descriptors
                    if taxon.descriptor_meta_model is not None and taxon.descriptor_meta_model.pk != dmm_id:
                        # clean previous descriptors and owns
                        descriptors_builder = DescriptorsBuilder(taxon)

                        descriptors_builder.clear(taxon.descriptor_meta_model)

                        taxon.descriptor_meta_model = None
                        taxon.descriptors = {}

                        descriptors_builder.update_associations()

                    # and set the new one
                    content_type = get_object_or_404(ContentType, app_label="taxonomy", model="taxon")
                    dmm = get_object_or_404(DescriptorMetaModel, id=dmm_id, target=content_type)

                    taxon.descriptor_meta_model = dmm
                    taxon.descriptors = {}

                    result['descriptor_meta_model'] = dmm.id
                    result['descriptors'] = {}

                taxon.update_field(['descriptor_meta_model', 'descriptors'])

            # update descriptors
            if 'descriptors' in request.data:
                descriptors = request.data["descriptors"]

                descriptors_builder = DescriptorsBuilder(taxon)

                descriptors_builder.check_and_update(taxon.descriptor_meta_model, descriptors)
                taxon.descriptors = descriptors_builder.descriptors

                descriptors_builder.update_associations()

                result['descriptors'] = taxon.descriptors

                taxon.descriptors_diff = descriptors
                taxon.update_field('descriptors')

            taxon.save()

    except IntegrityError as e:
        logger.log(repr(e))
        raise SuspiciousOperation(_("Unable to update the taxon"))

    return HttpResponseRest(request, result)


@RestTaxonId.def_auth_request(Method.DELETE, Format.JSON, perms={
    'taxonomy.delete_taxon': _("You are not allowed to remove a taxon"),
})
def delete_taxon(request, tax_id):
    taxon = get_object_or_404(Taxon, id=int(tax_id))

    # check if some entities uses it before remove
    if taxon.in_usage():
        raise SuspiciousOperation(_("This taxon is referred by one or more entities. It cannot be deleted."))

    # check if some accessions uses it before remove
    if taxon.children.exists():
        raise SuspiciousOperation(_("This taxon has sub-ranks. It cannot be deleted."))

    taxon.delete()

    return HttpResponseRest(request, {})


@RestTaxonIdSynonym.def_auth_request(
    Method.POST, Format.JSON, content={
        "type": "object",
        "properties": {
            "type": {"type:": "number"},
            "language": TaxonSynonym.LANGUAGE_VALIDATOR,
            "name": TaxonSynonym.NAME_VALIDATOR
        },
    },
    perms={
        'taxonomy.change_taxon': _("You are not allowed to modify a taxon"),
        'taxonomy.add_taxonsynonym': _("You are not allowed to add a synonym to a taxon"),
    }
)
def taxon_add_synonym(request, tax_id):
    taxon = get_object_or_404(Taxon, id=int(tax_id))

    synonym = {
        'type': int(request.data['type']),
        'name': request.data['name'],
        'language': str(request.data['language']),
    }

    Taxonomy.add_synonym(taxon, synonym)

    return HttpResponseRest(request, {})


@RestTaxonIdSynonymId.def_auth_request(
    Method.PUT, Format.JSON, content={
        "type": "object",
        "properties": {
            "name": TaxonSynonym.NAME_VALIDATOR
        },
    },
    perms={
        'taxonomy.change_taxon': _("You are not allowed to modify a taxon"),
        'taxonomy.change_taxonsynonym': _("You are not allowed to modify a synonym to a taxon"),
    }
)
def taxon_change_synonym(request, tax_id, syn_id):
    synonym = get_object_or_404(TaxonSynonym, Q(id=int(syn_id)), Q(taxon=int(tax_id)))

    # @todo fix name/synonym
    name = request.data['name']

    try:
        with transaction.atomic():
            # rename the taxon if the synonym name is the taxon name
            if synonym.taxon.name == synonym.name:
                synonym.taxon.name = name
                synonym.taxon.update_field('name')

                synonym.taxon.save()

            synonym.name = name
            synonym.update_field('name')

            synonym.save()

            result = {
                'id': synonym.id,
                'name': synonym.name
            }
    except IntegrityError as e:
        logger.log(repr(e))
        raise SuspiciousOperation(_("Unable to rename a synonym of a taxon"))

    return HttpResponseRest(request, result)


@RestTaxonIdSynonymId.def_auth_request(
    Method.DELETE, Format.JSON,
    perms={
        'taxonomy.change_taxon': _("You are not allowed to modify a taxon"),
        'taxonomy.delete_taxonsynonym': _("You are not allowed to delete a synonym from a taxon"),
    }
)
def taxon_remove_synonym(request, tax_id, syn_id):
    synonym = get_object_or_404(TaxonSynonym, Q(id=int(syn_id)), Q(taxon=int(tax_id)))

    if synonym.type == TaxonSynonymType.PRIMARY.value:
        raise SuspiciousOperation(_("It is not possible to remove a primary synonym"))

    synonym.delete()

    return HttpResponseRest(request, {})


@RestTaxonomyRank.def_request(Method.GET, Format.JSON)
def get_rank_list(request):
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
def get_taxon_children(request, tax_id):
    """
    Return the list of direct children for the given taxon.
    """
    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = request.GET.get('cursor')
    limit = results_per_page

    taxon = get_object_or_404(Taxon, id=int(tax_id))

    if cursor:
        cursor_name, cursor_id = cursor.rsplit('/', 1)
        qs = taxon.children.filter(Q(name__gt=cursor_name))
    else:
        qs = taxon.children.all()

    qs = qs.prefetch_related(Prefetch(
            "synonyms",
            queryset=TaxonSynonym.objects.all().order_by('type', 'language'))
    ).order_by('name')[:limit]

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

        for synonym in child.synonyms.all():
            t['synonyms'].append({
                'id': synonym.id,
                'name': synonym.synonym,
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
def get_taxon_entities(request, tax_id):
    """
    Return the list of entities relating the given taxon.
    """
    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = request.GET.get('cursor')
    limit = results_per_page

    taxon = get_object_or_404(Taxon, id=int(tax_id))

    if cursor:
        cursor_name, cursor_content_type, cursor_id = cursor.rsplit('/', 2)
    else:
        cursor_name = cursor_content_type = cursor_id = None

    items = []

    from django.apps import apps
    children_entities = apps.get_app_config('taxonomy').children_entities

    rest = limit

    # content type local cache
    content_types = {}

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
                content_type = content_types.get(item.content_type_id)
                if content_type is None:
                    content_type = content_types[item.content_type_id] = '.'.join(item.content_type.natural_key())

                t = {
                    'id': item.id,
                    'content_type': content_type,
                    'name': item.name
                }

                items.append(t)

        if rest == 0:
            break

    if len(items) > 0:
        # prev cursor (asc order)
        item = items[0]
        prev_cursor = "%s/%s/%s" % (item['name'], item['content_type'], item['id'])

        # next cursor (asc order)
        item = items[-1]
        next_cursor = "%s/%s/%s" % (item['name'], item['content_type'], item['id'])
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
