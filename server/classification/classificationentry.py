# -*- coding: utf-8; -*-
#
# @file classificationentry.py
# @brief coll-gate classification entry rest handlers
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2016-09-01
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import SuspiciousOperation
from django.db import IntegrityError
from django.db import transaction
from django.db.models import Prefetch
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils.translation import ugettext_lazy as _

from classification import localsettings
from classification.classification import RestClassificationClassificationId
from descriptor.describable import DescriptorsBuilder
# from descriptor.models import Layout, DescriptorModelType
from descriptor.models import Layout, Descriptor
from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest
from main.cursor import CursorQuery
from main.models import Language, EntitySynonymType
from .base import RestClassification
from .controller import ClassificationEntryManager
from .models import ClassificationEntry
from .models import ClassificationEntrySynonym


class RestClassificationEntry(RestClassification):
    regex = r'^classificationentry/$'
    suffix = 'classificationentry'


class RestClassificationEntrySearch(RestClassificationEntry):
    regex = r'^search/$'
    suffix = 'search'


class RestClassificationEntryCount(RestClassificationEntry):
    regex = r'^count/$'
    name = 'count'


class RestClassificationEntryId(RestClassificationEntry):
    regex = r'^(?P<cls_id>[0-9]+)/$'
    suffix = 'id'


class RestClassificationEntryIdChildren(RestClassificationEntryId):
    regex = r'^children/$'
    suffix = 'children'


class RestClassificationEntryIdChildrenCount(RestClassificationEntryIdChildren):
    regex = r'^count/$'
    suffix = 'count'


class RestClassificationEntryIdEntities(RestClassificationEntryId):
    regex = r'^entities/$'
    suffix = 'entities'


class RestClassificationClassificationIdClassificationEntry(RestClassificationClassificationId):
    regex = r'^classificationentry/$'
    suffix = 'classificationentry'


class RestClassificationClassificationIdClassificationEntryCount(RestClassificationClassificationIdClassificationEntry):
    regex = r'^count/$'
    suffix = 'count'


@RestClassificationEntry.def_auth_request(Method.POST, Format.JSON, content={
    "type": "object",
    "properties": {
        "name": ClassificationEntrySynonym.NAME_VALIDATOR,
        "layout": {"type": "number"},
        # "layout": {"type": ["number", "null"], "required": False},
        "rank": {"type": "number", 'minimum': 0},
        "parent": {"type": ["number", "null"], "required": False},
        "descriptors": {"type": "object"},
        # "descriptors": {"type": "object", "required": False}
        "language": ClassificationEntrySynonym.LANGUAGE_VALIDATOR
    },
}, perms={'classification.add_classificationentry': _('You are not allowed to create a classification entry')}
                                          )
def create_classification_entry(request):
    """
    Create a new classification entry with a primary synonym in the current language.
    """
    parameters = request.data

    parent = None
    if parameters.get('parent'):
        parent_id = int_arg(parameters['parent'])
        parent = get_object_or_404(ClassificationEntry, id=parent_id)

    rank_id = int_arg(parameters['rank'])
    language = parameters['language']
    layout = request.data.get('layout')
    descriptors = request.data.get('descriptors')

    if not Language.objects.filter(code=language).exists():
        raise SuspiciousOperation(_("The language is not supported"))

    if layout is not None and descriptors is not None:
        layout_id = int_arg(layout)

        content_type = get_object_or_404(ContentType, app_label="classification", model="classificationentry")
        layout = get_object_or_404(Layout, id=layout_id, target=content_type)
    else:
        # @todo do we allow that ?
        layout = None

    classification_entry = None

    try:
        with transaction.atomic():
            classification_entry = ClassificationEntryManager.create_classification_entry(
                parameters['name'],
                rank_id,
                parent,
                language,
                layout,
                descriptors)
    except IntegrityError as e:
        Descriptor.integrity_except(ClassificationEntry, e)

    response = {
        'id': classification_entry.id,
        'name': classification_entry.name,
        'rank': classification_entry.rank_id,
        'parent': classification_entry.parent_id if parent else None,
        'parent_list': classification_entry.parent_list,
        'synonyms': [],
        'layout': classification_entry.layout_id if layout else None,
        'descriptors': classification_entry.descriptors
    }

    for s in classification_entry.synonyms.all():
        response['synonyms'].append({
            'id': s.id,
            'name': s.name,
            'synonym_type': s.synonym_type_id,
            'language': s.language
        })

    return HttpResponseRest(request, response)


@RestClassificationEntry.def_auth_request(Method.GET, Format.JSON, perms={
    'classification.list_classificationentry': _("You are not allowed to list the classifications entries")
})
def get_classification_entry_list(request):
    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = json.loads(request.GET.get('cursor', 'null'))
    limit = results_per_page
    sort_by = json.loads(request.GET.get('sort_by', '[]'))

    if not len(sort_by) or sort_by[-1] not in ('id', '+id', '-id'):
        order_by = sort_by + ['id']
    else:
        order_by = sort_by

    cq = CursorQuery(ClassificationEntry)

    if request.GET.get('search'):
        search = json.loads(request.GET['search'])
        for criteria in search:
            if 'field' in criteria and criteria.get('field').lstrip('&') in EntitySynonymType.objects.filter(
                    target_model=ContentType.objects.get_for_model(ClassificationEntry)).values_list('name',
                                                                                                     flat=True).distinct():
                cq.select_synonym(ClassificationEntrySynonym)
                break
        cq.filter(search)

    if request.GET.get('filters'):
        filters = json.loads(request.GET['filters'])
        for criteria in filters:
            if 'field' in criteria and criteria.get('field').lstrip('&') in EntitySynonymType.objects.filter(target_model=ContentType.objects.get_for_model(ClassificationEntry)).values_list('name', flat=True).distinct():
                cq.select_synonym(ClassificationEntrySynonym)
                break
        cq.filter(filters)

    # if request.GET.get('filters'):
    #     cq.filter(json.loads(request.GET['filters']))

    # if request.GET.get('search'):
    #     cq.filter(json.loads(request.GET['search']))

    cq.prefetch_related(Prefetch(
            "synonyms",
            queryset=ClassificationEntrySynonym.objects.all().order_by('synonym_type', 'language')))

    cq.select_related('parent->name', 'parent->rank')

    cq.cursor(cursor, order_by)
    cq.order_by(order_by).limit(limit)

    classification_entry_items = []

    for classification_entry in cq:
        c = {
            'id': classification_entry.id,
            'name': classification_entry.name,
            'parent': classification_entry.parent_id,
            'rank': classification_entry.rank_id,
            'layout': classification_entry.layout_id,
            'descriptors': classification_entry.descriptors,
            'parent_list': classification_entry.parent_list,
            # 'parent_details': None,
            'synonyms': {}
        }

        # if classification_entry.parent:
        #     c['parent_details'] = {
        #         'id': classification_entry.parent.id,
        #         'name': classification_entry.parent.name,
        #         'rank': classification_entry.parent.rank_id
        #     }

        for synonym in classification_entry.synonyms.all():
            synonym_type = EntitySynonymType.objects.get(id=synonym.synonym_type_id)
            c['synonyms'][synonym_type.name] = {
                'id': synonym.id,
                'name': synonym.name,
                'synonym_type': synonym.synonym_type_id,
                'language': synonym.language
            }

        classification_entry_items.append(c)

    results = {
        'perms': [],
        'items': classification_entry_items,
        'prev': cq.prev_cursor,
        'cursor': cursor,
        'next': cq.next_cursor,
    }

    return HttpResponseRest(request, results)


@RestClassificationEntryCount.def_auth_request(Method.GET, Format.JSON, perms={
    'classification.list_classificationentry': _("You are not allowed to list the classifications entries")
})
def get_classification_list_count(request):
    from main.cursor import CursorQuery
    cq = CursorQuery(ClassificationEntry)

    if request.GET.get('search'):
        search = json.loads(request.GET['search'])
        for criteria in search:
            if 'field' in criteria and criteria.get('field').lstrip('&') in EntitySynonymType.objects.filter(target_model=ContentType.objects.get_for_model(ClassificationEntry)).values_list('name', flat=True).distinct():
                cq.select_synonym(ClassificationEntrySynonym)
                break
        cq.filter(search)

    if request.GET.get('filters'):
        filters = json.loads(request.GET['filters'])
        for criteria in filters:
            if 'field' in criteria and criteria.get('field').lstrip('&') in EntitySynonymType.objects.filter(target_model=ContentType.objects.get_for_model(ClassificationEntry)).values_list('name', flat=True).distinct():
                cq.select_synonym(ClassificationEntrySynonym)
                break
        cq.filter(filters)

    count = cq.count()

    results = {
        'count': count
    }

    return HttpResponseRest(request, results)


@RestClassificationEntryId.def_auth_request(Method.GET, Format.JSON)
def get_classification_entry_details_json(request, cls_id):
    classification_entry = get_object_or_404(ClassificationEntry, id=int(cls_id))

    # query for parents
    parents = []
    parents_cls = ClassificationEntry.objects.filter(id__in=classification_entry.parent_list)

    for parent in parents_cls:
        parents.insert(0, {
            'id': parent.id,
            'name': parent.name,
            'rank': parent.rank_id,
            'parent': parent.parent_id
        })

    result = {
        'id': classification_entry.id,
        'name': classification_entry.name,
        'rank': classification_entry.rank_id,
        'classification': classification_entry.rank.classification_id,  # extra query cost
        'parent': classification_entry.parent_id,
        'parent_list': classification_entry.parent_list,
        'parent_details': parents,
        'synonyms': [],
        'layout': classification_entry.layout_id,
        'descriptors': classification_entry.descriptors,
    }

    for s in classification_entry.synonyms.all().order_by('synonym_type', 'language'):
        synonym = {
            'id': s.id,
            'name': s.name,
            'synonym_type': s.synonym_type_id,
            'language': s.language,
        }

        result['synonyms'].append(synonym)

    return HttpResponseRest(request, result)


@RestClassificationEntrySearch.def_auth_request(Method.GET, Format.JSON, ('filters',))
def search_classification_entry(request):
    """
    Quick search for a classification entry with a exact or partial name and a rank.
    """
    filters = json.loads(request.GET['filters'])

    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = request.GET.get('cursor')
    limit = results_per_page

    if cursor:
        cursor = json.loads(cursor)
        cursor_name, cursor_id = cursor
        qs = ClassificationEntry.objects.filter(Q(name__gt=cursor_name))
    else:
        qs = ClassificationEntry.objects.all()

    if 'name' in filters['fields']:
        name_method = filters.get('method', 'ieq')

        if name_method == 'ieq':
            qs = qs.filter(synonyms__name__iexact=filters['name'])
        elif name_method == 'icontains':
            qs = qs.filter(synonyms__name__icontains=filters['name'])

    if 'classification' in filters['fields']:
        classification_method = filters.get('classification_method', 'eq')

        if classification_method == 'eq':
            qs = qs.filter(rank__classification_id=int_arg(filters['classification']))
        elif classification_method == 'neq':
            qs = qs.exclude(rank__classification_id=int_arg(filters['classification']))

    if 'level' in filters['fields']:
        level = int_arg(filters['level'])
        level_method = filters.get('level_method', 'lt')

        if level_method == 'eq':
            qs = qs.filter(Q(rank__level=level))
        elif level_method == 'lt':
            qs = qs.filter(Q(rank__level__lt=level))
        elif level_method == 'lte':
            qs = qs.filter(Q(rank__level__lte=level))
        elif level_method == 'gt':
            qs = qs.filter(Q(rank__level__gt=level))
        elif level_method == 'gte':
            qs = qs.filter(Q(rank__level__gte=level))

    qs = qs.prefetch_related(
        Prefetch(
            "synonyms",
            queryset=ClassificationEntrySynonym.objects.exclude(
                synonym_type=localsettings.synonym_type_classification_entry_name).order_by('synonym_type', 'language'))
    )

    qs = qs.order_by('name').distinct()[:limit]

    items_list = []

    for classification_entry in qs:
        label = classification_entry.name

        for synonym in classification_entry.synonyms.all():
            label += ', ' + synonym.name

        a = {
            'id': classification_entry.id,
            'label': label,
            'value': classification_entry.name
        }

        items_list.append(a)

    if len(items_list) > 0:
        # prev cursor (asc order)
        obj = items_list[0]
        prev_cursor = (obj['value'], obj['id'])

        # next cursor (asc order)
        obj = items_list[-1]
        next_cursor = (obj['value'], obj['id'])
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


@RestClassificationEntryId.def_auth_request(
    Method.PATCH, Format.JSON, content={
        "type": "object",
        "properties": {
            "parent": {"type": ["number", "null"], 'required': False},
            "layout": {"type": ["integer", "null"], 'required': False},
            "descriptors": {"type": "object", 'required': False}
        },
    },
    perms={
        'classification.change_classificationentry': _("You are not allowed to modify a classification entry"),
    }
)
def patch_classification_entry(request, cls_id):
    classification_entry = get_object_or_404(ClassificationEntry, id=int(cls_id))

    result = {}

    if 'parent' in request.data:
        if request.data['parent'] is None:
            classification_entry.parent = None
            classification_entry.parent_list = []

            result['parent'] = None
            result['parent_list'] = []
            result['parent_details'] = []
        else:
            pcls_id = int(request.data['parent'])

            parent = get_object_or_404(ClassificationEntry, id=pcls_id)

            classification_entry.parent = parent

            # @todo rank level
            if parent.rank_id >= classification_entry.rank_id:
                raise SuspiciousOperation(_("The rank of the parent must be lowest than the classification entry itself"))

            # make parent list
            ClassificationEntryManager.update_parents(classification_entry, parent)

            # query for parents
            parents = []
            parents_cls = ClassificationEntry.objects.filter(id__in=classification_entry.parent_list)

            for parent in parents_cls:
                parents.insert(0, {
                    'id': parent.id,
                    'name': parent.name,
                    'rank': parent.rank_id,
                    'parent': parent.parent_id
                })

            result['parent'] = parent.id
            result['parent_list'] = parents
            result['parent_details'] = parents

        classification_entry.update_field(['parent', 'parent_list'])

    try:
        with transaction.atomic():
            # update layout of descriptors and descriptors
            if 'layout' in request.data:
                layout_id = request.data["layout"]

                # changing of layout erase all previous descriptors values
                if layout_id is None and classification_entry.layout is not None:
                    # clean previous descriptors and owns
                    descriptors_builder = DescriptorsBuilder(classification_entry)

                    descriptors_builder.clear(classification_entry.layout)

                    classification_entry.layout = None
                    classification_entry.descriptors = {}

                    descriptors_builder.update_associations()

                    result['layout'] = None
                    result['descriptors'] = {}

                elif layout_id is not None:
                    # existing descriptors and new layout is different : first clean previous descriptors
                    if (classification_entry.layout is not None and
                            classification_entry.layout.pk != layout_id):

                        # clean previous descriptors and owns
                        descriptors_builder = DescriptorsBuilder(classification_entry)

                        descriptors_builder.clear(classification_entry.layout)

                        classification_entry.layout = None
                        classification_entry.descriptors = {}

                        descriptors_builder.update_associations()

                    # and set the new one
                    content_type = get_object_or_404(ContentType, app_label="classification", model="classificationentry")
                    layout = get_object_or_404(Layout, id=layout_id, target=content_type)

                    classification_entry.layout = layout
                    classification_entry.descriptors = {}

                    result['layout'] = layout.id
                    result['descriptors'] = {}

                    classification_entry.update_field(['layout', 'descriptors'])

            # update descriptors
            if 'descriptors' in request.data:
                descriptors = request.data["descriptors"]

                descriptors_builder = DescriptorsBuilder(classification_entry)

                descriptors_builder.check_and_update(classification_entry.layout, descriptors)
                classification_entry.descriptors = descriptors_builder.descriptors

                descriptors_builder.update_associations()

                result['descriptors'] = classification_entry.descriptors

                classification_entry.update_descriptors(descriptors_builder.changed_descriptors())
                classification_entry.update_field('descriptors')

            classification_entry.save()

    except IntegrityError as e:
        Descriptor.integrity_except(ClassificationEntry, e)

    return HttpResponseRest(request, result)


@RestClassificationEntryId.def_auth_request(Method.DELETE, Format.JSON, perms={
    'classification.delete_classificationentry': _("You are not allowed to remove a classification entry"),
})
def delete_classification_entry(request, cls_id):
    classification_entry = get_object_or_404(ClassificationEntry, id=int(cls_id))

    # check if some entities uses it before remove
    if classification_entry.in_usage():
        raise SuspiciousOperation(
            _("This classification entry is referred by one or more entities. It cannot be deleted."))

    # check if some accessions uses it before remove
    if classification_entry.children.exists():
        raise SuspiciousOperation(_("This classification entry has sub-ranks. It cannot be deleted."))

    classification_entry.delete()

    return HttpResponseRest(request, {})


@RestClassificationEntryIdChildren.def_auth_request(Method.GET, Format.JSON, perms={
    'classification.list_classificationentry': _("You are not allowed to list the classifications entries")
})
def get_classification_entry_children(request, cls_id):
    """
    Return the list of direct children for the given classification entry.
    """
    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = json.loads(request.GET.get('cursor', 'null'))
    limit = results_per_page
    sort_by = json.loads(request.GET.get('sort_by', '[]'))

    if not len(sort_by) or sort_by[-1] not in ('id', '+id', '-id'):
        order_by = sort_by + ['id']
    else:
        order_by = sort_by

    classification_entry = get_object_or_404(ClassificationEntry, id=int(cls_id))

    from main.cursor import CursorQuery
    cq = CursorQuery(ClassificationEntry)

    # if only children
    if request.GET.get('deeply', False):
        cq.filter(parent_list__in=[classification_entry.id])
    else:
        cq.filter(parent=classification_entry.id)

    if request.GET.get('filters'):
        cq.filter(json.loads(request.GET['filters']))

    cq.prefetch_related(Prefetch(
            "synonyms",
            queryset=ClassificationEntrySynonym.objects.all().order_by('synonym_type', 'language')))

    cq.select_related('parent->name', 'parent->rank')

    cq.cursor(cursor, order_by)
    cq.order_by(order_by).limit(limit)

    classification_items = []

    for classification in cq:
        c = {
            'id': classification.id,
            'name': classification.name,
            'parent': classification.parent_id,
            'rank': classification.rank_id,
            'layout': classification.layout_id,
            'descriptors': classification.descriptors,
            'parent_list': classification.parent_list,
            'parent_details': None,
            'synonyms': []
        }

        if classification.parent:
            c['parent_details'] = {
                'id': classification.parent.id,
                'name': classification.parent.name,
                'rank': classification.parent.rank_id
            }

        for synonym in classification.synonyms.all():
            c['synonyms'].append({
                'id': synonym.id,
                'name': synonym.name,
                'synonym_type': synonym.synonym_type_id,
                'language': synonym.language
            })

        classification_items.append(c)

    results = {
        'perms': [],
        'items': classification_items,
        'prev': cq.prev_cursor,
        'cursor': cursor,
        'next': cq.next_cursor,
    }

    return HttpResponseRest(request, results)


@RestClassificationEntryIdChildrenCount.def_auth_request(Method.GET, Format.JSON, perms={
    'classification.list_classificationentry': _("You are not allowed to list the classifications entries")
})
def get_classification_entry_children_list_count(request, cls_id):
    """
    Return the count of direct children for the given classification entry.
    """
    classification_entry = get_object_or_404(ClassificationEntry, id=int(cls_id))

    from main.cursor import CursorQuery
    cq = CursorQuery(ClassificationEntry)

    # if only children
    if request.GET.get('deeply', False):
        cq.filter(parent_list__in=[classification_entry.id])
    else:
        cq.filter(parent=classification_entry.id)

    if request.GET.get('filters'):
        cq.filter(json.loads(request.GET['filters']))

    count = cq.count()

    results = {
        'count': count
    }

    return HttpResponseRest(request, results)


@RestClassificationEntryIdEntities.def_auth_request(Method.GET, Format.JSON)
def get_classification_entry_entities(request, cls_id):
    """
    Return the list of entities relating the given classification entry.
    """
    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = request.GET.get('cursor')
    limit = results_per_page

    classification_entry = get_object_or_404(ClassificationEntry, id=int(cls_id))

    if cursor:
        cursor = json.loads(cursor)
        cursor_name, cursor_content_type, cursor_id = cursor
    else:
        cursor_name = cursor_content_type = cursor_id = None

    items = []

    from django.apps import apps
    children_entities = apps.get_app_config('classification').children_entities

    rest = limit

    # content type local cache
    content_types = {}

    # we do a manual union for the different set of content_type
    for entity in children_entities:
        field_name = entity._meta.model_name + '_set'

        # check _layout type with cursor content type (grouped by content_type)
        if cursor_content_type is not None:
            if ".".join((entity._meta.app_label, entity._meta.model_name)) == cursor_content_type:
                cursor_content_type = None
            else:
                # continue with next entities set
                continue

        children = getattr(classification_entry, field_name)
        if children and rest > 0:
            if cursor_name:  # name could be not unique
                qs = children.filter(Q(name__gt=cursor_name) | (Q(name__gte=cursor_name) & Q(id__gt=cursor_id)))
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

                # @todo have a common method/interface to any entities of classification entry get_fields(...)

                if hasattr(item, 'code'):
                    t['code'] = item.code

                # if hasattr(item, 'synonyms'):
                #     t['synonym'] = items.synonyms.filter(synonym_type=)

                items.append(t)

        if rest == 0:
            break

    if len(items) > 0:
        # prev cursor (asc order)
        item = items[0]
        prev_cursor = (item['name'], item['content_type'], item['id'])

        # next cursor (asc order)
        item = items[-1]
        next_cursor = (item['name'], item['content_type'], item['id'])
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


@RestClassificationClassificationIdClassificationEntry.def_auth_request(Method.GET, Format.JSON, perms={
    'classification.list_classificationentry': _("You are not allowed to list the classifications entries")
})
def get_classification_id_entry_list(request, cls_id):
    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = json.loads(request.GET.get('cursor', 'null'))
    limit = results_per_page
    sort_by = json.loads(request.GET.get('sort_by', '[]'))

    if not len(sort_by) or sort_by[-1] not in ('id', '+id', '-id'):
        order_by = sort_by + ['id']
    else:
        order_by = sort_by

    cq = CursorQuery(ClassificationEntry)

    cq.filter(rank__classification=int_arg(cls_id))

    if request.GET.get('filters'):
        filters = json.loads(request.GET['filters'])
        for criteria in filters:
            if 'field' in criteria and criteria.get('field').lstrip('&') in EntitySynonymType.objects.filter(
                    target_model=ContentType.objects.get_for_model(ClassificationEntry)).values_list('name',
                                                                                                     flat=True).distinct():
                cq.select_synonym(ClassificationEntrySynonym)
                break
        cq.filter(filters)

    cq.prefetch_related(Prefetch(
            "synonyms",
            queryset=ClassificationEntrySynonym.objects.all().order_by('synonym_type', 'language')))

    cq.select_related('rank->classification')
    # cq.select_related('parent->name', 'parent->rank')

    cq.cursor(cursor, order_by)
    cq.order_by(order_by).limit(limit)

    classification_entry_items = []

    for classification_entry in cq:
        c = {
            'id': classification_entry.id,
            'name': classification_entry.name,
            'parent': classification_entry.parent_id,
            'rank': classification_entry.rank_id,
            'layout': classification_entry.layout_id,
            'descriptors': classification_entry.descriptors,
            'parent_list': classification_entry.parent_list,
            # 'parent_details': None,
            'synonyms': {}
        }

        # if classification_entry.parent:
        #     c['parent_details'] = {
        #         'id': classification_entry.parent.id,
        #         'name': classification_entry.parent.name,
        #         'rank': classification_entry.parent.rank_id
        #     }

        for synonym in classification_entry.synonyms.all():
            synonym_type = EntitySynonymType.objects.get(id=synonym.synonym_type_id)
            c['synonyms'][synonym_type.name] = {
                'id': synonym.id,
                'name': synonym.name,
                'synonym_type': synonym.synonym_type_id,
                'language': synonym.language
            }

        classification_entry_items.append(c)

    results = {
        'perms': [],
        'items': classification_entry_items,
        'prev': cq.prev_cursor,
        'cursor': cursor,
        'next': cq.next_cursor,
    }

    return HttpResponseRest(request, results)


@RestClassificationClassificationIdClassificationEntryCount.def_auth_request(Method.GET, Format.JSON, perms={
    'classification.list_classificationentry': _("You are not allowed to list the classifications entries")
})
def get_classification_id_list_count(request, cls_id):
    from main.cursor import CursorQuery
    cq = CursorQuery(ClassificationEntry)

    cq.filter(rank__classification=int_arg(cls_id))

    if request.GET.get('filters'):
        filters = json.loads(request.GET['filters'])
        for criteria in filters:
            if 'field' in criteria and criteria.get('field').lstrip('&') in EntitySynonymType.objects.filter(
                    target_model=ContentType.objects.get_for_model(ClassificationEntry)).values_list('name',
                                                                                                     flat=True).distinct():
                cq.select_synonym(ClassificationEntrySynonym)
                break
        cq.filter(filters)

    cq.select_related('rank->classification')

    count = cq.count()

    results = {
        'count': count
    }

    return HttpResponseRest(request, results)
