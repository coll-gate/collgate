# -*- coding: utf-8;-*-
#
# @file accessionpanel.py
# @brief
# @author Medhi BOULNEMOUR (INRA UMR1095)
# @date 2017-09-12
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details

from descriptor.describable import DescriptorsBuilder
from django.contrib.contenttypes.models import ContentType
from descriptor.models import Layout, Descriptor
from igdectk.rest.handler import *
from django.db.models import Q, Prefetch
from igdectk.rest.response import HttpResponseRest
from django.core.exceptions import SuspiciousOperation
from django.db import transaction, IntegrityError
from django.shortcuts import get_object_or_404
from django.utils.translation import ugettext_lazy as _

from main.models import EntitySynonymType
from .models import AccessionPanel, Accession, AccessionSynonym, PanelType
from .base import RestAccession
from .accession import RestAccessionId


class RestAccessionPanel(RestAccession):
    regex = r'^accessionpanel/$'
    name = "accessionpanel"


class RestAccessionIdPanels(RestAccessionId):
    regex = r'^panels/$'
    suffix = 'panels'


class RestAccessionIdPanelsCount(RestAccessionIdPanels):
    regex = r'^count/$'
    name = "count"


class RestAccessionPanelSearch(RestAccessionPanel):
    regex = r'^search/$'
    suffix = 'search'


class RestAccessionPanelCount(RestAccessionPanel):
    regex = r'^count/$'
    name = "count"


class RestAccessionPanelId(RestAccessionPanel):
    regex = r'^(?P<panel_id>[0-9]+)/$'
    suffix = 'id'


class RestAccessionPanelIdAccessions(RestAccessionPanelId):
    regex = r'^accessions/$'
    name = "accessions"


class RestAccessionPanelIdAccessionsCount(RestAccessionPanelIdAccessions):
    regex = r'^count/$'
    name = "count"


@RestAccessionIdPanels.def_auth_request(Method.GET, Format.JSON)
def get_accession_panels(request, acc_id):
    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = json.loads(request.GET.get('cursor', 'null'))
    limit = results_per_page
    sort_by = json.loads(request.GET.get('sort_by', '[]'))

    if not len(sort_by) or sort_by[-1] not in ('id', '+id', '-id'):
        order_by = sort_by + ['id']
    else:
        order_by = sort_by

    accession = Accession.objects.get(id=int(acc_id))
    panels = list(accession.panels.all().values_list('id', flat=True))

    from main.cursor import CursorQuery
    cq = CursorQuery(AccessionPanel)
    cq.filter(id__in=panels)

    # only persistent panels
    cq.filter(panel_type=PanelType.PERSISTENT.value)

    if request.GET.get('filters'):
        filters = json.loads(request.GET['filters'])
        cq.filter(filters)

    cq.cursor(cursor, order_by)
    cq.order_by(order_by).limit(limit)

    panel_items = []

    for panel in cq:
        a = {
            'id': panel.pk,
            'name': panel.name,
            'layout': panel.layout.pk if panel.layout else None,
            'descriptors': panel.descriptors,
            'accessions_amount': panel.accessions.count()
        }

        panel_items.append(a)

    results = {
        'perms': [],
        'items': panel_items,
        'prev': cq.prev_cursor,
        'cursor': cursor,
        'next': cq.next_cursor,
    }

    return HttpResponseRest(request, results)


@RestAccessionIdPanelsCount.def_auth_request(Method.GET, Format.JSON)
def count_accession_panels(request, acc_id):
    accession = Accession.objects.get(id=int(acc_id))
    panels = list(accession.panels.all().values_list('id', flat=True))

    from main.cursor import CursorQuery
    cq = CursorQuery(AccessionPanel)
    cq.filter(id__in=panels)

    # only persistent panels
    cq.filter(panel_type=PanelType.PERSISTENT.value)

    if request.GET.get('filters'):
        filters = json.loads(request.GET['filters'])
        cq.filter(filters)

    results = {
        'count': cq.count()
    }

    return HttpResponseRest(request, results)


@RestAccessionPanel.def_auth_request(Method.POST, Format.JSON, content={
    "type": "object",
    "properties": {
        "name": AccessionPanel.NAME_VALIDATOR,
        "selection": {
            "type": "object",
            "properties": {
                "select": {
                    "type": [
                        {
                            "type": "object",
                            "properties": {
                                "op": {"enum": ['in', 'notin']},
                                "term": {"type": "string"},
                                "value": {"type": "array"},
                            },
                        },
                        {
                            "type": "boolean"
                        }
                    ]
                },

            },
            "additionalProperties": {
                "from": {
                    "type": "object",
                    "properties": {
                        "content_type": {"type": "string"},
                        "id": {"type": "integer"}
                    }
                },
                "search": {"type": "object"},
                "filters": {"type": "object"}
            }
        }
    }
}, perms={
    'accession.add_accessionpanel': _("You are not allowed to create an accession panel")
})
def create_panel(request):
    name = request.data['name']
    selection = request.data['selection']['select']
    related_entity = request.data['selection']['from']
    search = request.data['selection']['search']
    filters = request.data['selection']['filters']
    layout_id = request.data['layout']
    descriptors = request.data['descriptors']

    layout = None

    # check uniqueness of the name
    if AccessionPanel.objects.filter(name=name).exists():
        raise SuspiciousOperation(_("The name of the panel is already used"))

    if layout_id is not None:
        content_type = get_object_or_404(ContentType, app_label="accession", model="accessionpanel")
        layout = get_object_or_404(Layout, id=int_arg(layout_id), target=content_type)

    from main.cursor import CursorQuery
    cq = CursorQuery(Accession)

    if search:
        cq.filter(search)

    if filters:
        cq.filter(filters)

    cq.m2m_to_array_field(
        relationship=AccessionPanel.accessions,
        selected_field='accessionpanel_id',
        from_related_field='id',
        to_related_field='accession_id',
        alias='panels'
    )

    cq.m2m_to_array_field(
        relationship=Accession.classifications_entries,
        selected_field='classification_entry_id',
        from_related_field='id',
        to_related_field='accession_id',
        alias='classifications'
    )

    cq.set_synonym_model(AccessionSynonym)

    if related_entity:
        label, model = related_entity['content_type'].split('.')
        content_type = get_object_or_404(ContentType, app_label=label, model=model)
        model_class = content_type.model_class()
        cq.inner_join(model_class, **{model: int_arg(related_entity['id'])})

    try:
        with transaction.atomic():
            acc_panel = AccessionPanel(name=name)
            acc_panel.panel_type = PanelType.PERSISTENT.value
            acc_panel.layout = layout
            acc_panel.count = 0

            # descriptors
            descriptors_builder = DescriptorsBuilder(acc_panel)

            if layout:
                descriptors_builder.check_and_update(layout, descriptors)
                acc_panel.descriptors = descriptors_builder.descriptors

            acc_panel.save()

            # update owner on external descriptors
            descriptors_builder.update_associations()

            if isinstance(selection, bool):
                if selection is True:
                    acc_panel.accessions.add(*cq)
                    acc_panel.count = cq.count()

            elif selection['op'] == 'in':
                acc_panel.accessions.add(*cq.filter(id__in=selection['value']))
                acc_panel.count = cq.filter(id__in=selection['value']).count()

            elif selection['op'] == 'notin':
                acc_panel.accessions.add(*cq.filter(id__notin=selection['value']))
                acc_panel.count = cq.filter(id__notin=selection['value']).count()

    except IntegrityError as e:
        Descriptor.integrity_except(AccessionPanel, e)

    response = {
        'id': acc_panel.pk,
        'name': acc_panel.name,
        'layout': acc_panel.layout.pk if acc_panel.layout else None,
        'descriptors': acc_panel.descriptors,
        'accessions_amount': acc_panel.count
    }

    return HttpResponseRest(request, response)


@RestAccessionPanelId.def_request(Method.GET, Format.JSON)
def get_panel(request, panel_id):
    panel = AccessionPanel.objects.get(id=int_arg(panel_id))

    results = {
        'id': panel.pk,
        'name': panel.name,
        'layout': panel.layout.pk if panel.layout else None,
        'descriptors': panel.descriptors,
        'accessions_amount': AccessionPanel.objects.get(id=int_arg(panel_id)).accessions.count()
    }

    return HttpResponseRest(request, results)


@RestAccessionPanelCount.def_auth_request(Method.GET, Format.JSON, perms={
    'accession.list_accessionpanel': _("You are not allowed to list the accession panels")
})
def get_panel_list_count(request):
    from main.cursor import CursorQuery
    cq = CursorQuery(AccessionPanel)

    # only persistent panels
    cq.filter(panel_type=PanelType.PERSISTENT.value)

    if request.GET.get('filters'):
        filters = json.loads(request.GET['filters'])
        cq.filter(filters)

    count = cq.count()

    results = {
        'count': count
    }

    return HttpResponseRest(request, results)


@RestAccessionPanel.def_auth_request(Method.GET, Format.JSON, perms={
    'accession.list_accessionpanel': _("You are not allowed to list the accession panels")
})
def get_panel_list(request):
    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = json.loads(request.GET.get('cursor', 'null'))
    limit = results_per_page
    sort_by = json.loads(request.GET.get('sort_by', '[]'))

    if not len(sort_by) or sort_by[-1] not in ('id', '+id', '-id'):
        order_by = sort_by + ['id']
    else:
        order_by = sort_by

    from main.cursor import CursorQuery
    cq = CursorQuery(AccessionPanel)

    # only persistent panels
    cq.filter(panel_type=PanelType.PERSISTENT.value)

    if request.GET.get('filters'):
        filters = json.loads(request.GET['filters'])
        cq.filter(filters)

    cq.cursor(cursor, order_by)
    cq.order_by(order_by).limit(limit)

    panel_items = []

    for panel in cq:
        a = {
            'id': panel.pk,
            'name': panel.name,
            'layout': panel.layout.pk if panel.layout else None,
            'descriptors': panel.descriptors,
            'accessions_amount': panel.accessions.count()
        }

        panel_items.append(a)

    results = {
        'perms': [],
        'items': panel_items,
        'prev': cq.prev_cursor,
        'cursor': cursor,
        'next': cq.next_cursor,
    }

    return HttpResponseRest(request, results)


@RestAccessionPanelId.def_auth_request(Method.DELETE, Format.JSON, perms={
    'accession.delete_accessionpanel': _("You are not allowed to delete accession panel")
})
def delete_panel(request, panel_id):
    panel = get_object_or_404(AccessionPanel, id=int(panel_id))
    panel.delete()

    return HttpResponseRest(request, {})


@RestAccessionPanelId.def_auth_request(Method.PATCH, Format.JSON, perms={
    'accession.change_accessionpanel': _("You are not allowed to modify accession panel")
}, content={
   "type": "object",
   "properties": {
       # "entity_status": AccessionPanel.ENTITY_STATUS_VALIDATOR_OPTIONAL,
       "layout": {"type": ["integer", "null"], 'required': False},
       "descriptors": {"type": "object", "required": False},
   },
   "additionalProperties": {
       "name": AccessionPanel.NAME_VALIDATOR
   }
})
def modify_panel(request, panel_id):
    acc_panel = get_object_or_404(AccessionPanel, id=int(panel_id))
    # entity_status = request.data.get("entity_status")
    descriptors = request.data.get("descriptors")

    result = {
        'id': acc_panel.id
    }

    try:
        with transaction.atomic():
            # if entity_status is not None and panel.entity_status != entity_status:
            #     panel.set_status(entity_status)
            #     result['entity_status'] = entity_status

            if 'name' in request.data:
                name = request.data['name']

                if AccessionPanel.objects.filter(name=name).exists():
                    raise SuspiciousOperation(_("The name of the panel is already used"))

                acc_panel.name = name
                result['name'] = name

            if 'layout' in request.data:
                layout_id = request.data["layout"]

                # changing of layout erase all previous descriptors values
                if layout_id is None and acc_panel.layout is not None:
                    # clean previous descriptors and owns
                    descriptors_builder = DescriptorsBuilder(acc_panel)

                    descriptors_builder.clear(acc_panel.layout)

                    acc_panel.layout = None
                    acc_panel.descriptors = {}

                    descriptors_builder.update_associations()

                    result['layout'] = None
                    result['descriptors'] = {}

                elif layout_id is not None:
                    # existing descriptors and new layout is different : first clean previous descriptors
                    if acc_panel.layout is not None and acc_panel.layout.pk != layout_id:
                        # clean previous descriptors and owns
                        descriptors_builder = DescriptorsBuilder(acc_panel)

                        descriptors_builder.clear(acc_panel.layout)

                        acc_panel.layout = None
                        acc_panel.descriptors = {}

                        descriptors_builder.update_associations()

                    # and set the new one
                    content_type = get_object_or_404(ContentType, app_label="accession", model="accessionpanel")
                    layout = get_object_or_404(Layout, id=layout_id, target=content_type)

                    acc_panel.layout = layout
                    acc_panel.descriptors = {}

                    result['layout'] = layout.id
                    result['descriptors'] = {}

                    acc_panel.update_field(['layout', 'descriptors'])

            if descriptors is not None:
                # update descriptors
                descriptors_builder = DescriptorsBuilder(acc_panel)

                descriptors_builder.check_and_update(acc_panel.layout, descriptors)

                acc_panel.descriptors = descriptors_builder.descriptors
                result['descriptors'] = acc_panel.descriptors

                descriptors_builder.update_associations()

                acc_panel.update_descriptors(descriptors_builder.changed_descriptors())
                acc_panel.update_field('descriptors')

            acc_panel.save()
    except IntegrityError as e:
        Descriptor.integrity_except(Accession, e)

    return HttpResponseRest(request, result)


# todo: set correct permissions... maybe list_panel_accession???
@RestAccessionPanelIdAccessionsCount.def_auth_request(Method.GET, Format.JSON, perms={
    'accession.list_accession': _("You are not allowed to list the accessions")
})
def get_panel_id_accession_list_count(request, panel_id):
    from main.cursor import CursorQuery
    cq = CursorQuery(Accession)

    if request.GET.get('search'):
        search = json.loads(request.GET['search'])
        cq.filter(search)

    if request.GET.get('filters'):
        filters = json.loads(request.GET['filters'])
        cq.filter(filters)

    cq.m2m_to_array_field(
        relationship=AccessionPanel.accessions,
        selected_field='accessionpanel_id',
        from_related_field='id',
        to_related_field='accession_id',
        alias='panels'
    )

    cq.m2m_to_array_field(
        relationship=Accession.classifications_entries,
        selected_field='classification_entry_id',
        from_related_field='id',
        to_related_field='accession_id',
        alias='classifications'
    )

    cq.set_synonym_model(AccessionSynonym)

    cq.inner_join(AccessionPanel, accessionpanel=int(panel_id))

    results = {
        'count': cq.count()
    }

    return HttpResponseRest(request, results)


@RestAccessionPanelIdAccessions.def_auth_request(Method.GET, Format.JSON, perms={
    'accession.list_accession': _("You are not allowed to list the accessions")
})
def get_panel_id_accession_list(request, panel_id):
    # check permission on this panel
    panel = get_object_or_404(AccessionPanel, id=int(panel_id))

    # check permission on this object
    from permission.utils import get_permissions_for
    perms = get_permissions_for(request.user, panel.content_type.app_label, panel.content_type.model, panel.pk)
    if 'accession.get_accessionpanel' not in perms:
        raise PermissionDenied(_('Invalid permission to access to this panel'))

    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = json.loads(request.GET.get('cursor', 'null'))
    limit = results_per_page
    sort_by = json.loads(request.GET.get('sort_by', '[]'))

    if not len(sort_by) or sort_by[-1] not in ('id', '+id', '-id'):
        order_by = sort_by + ['id']
    else:
        order_by = sort_by

    from main.cursor import CursorQuery
    cq = CursorQuery(Accession)

    if request.GET.get('search'):
        search = json.loads(request.GET['search'])
        cq.filter(search)

    if request.GET.get('filters'):
        filters = json.loads(request.GET['filters'])
        cq.filter(filters)

    cq.m2m_to_array_field(
        relationship=AccessionPanel.accessions,
        selected_field='accessionpanel_id',
        from_related_field='id',
        to_related_field='accession_id',
        alias='panels'
    )

    cq.m2m_to_array_field(
        relationship=Accession.classifications_entries,
        selected_field='classification_entry_id',
        from_related_field='id',
        to_related_field='accession_id',
        alias='classifications'
    )

    cq.set_synonym_model(AccessionSynonym)

    cq.prefetch_related(Prefetch(
        "synonyms",
        queryset=AccessionSynonym.objects.all().order_by('synonym_type', 'language')))

    cq.select_related('primary_classification_entry->name', 'primary_classification_entry->rank')

    cq.cursor(cursor, order_by)
    cq.inner_join(AccessionPanel, accessionpanel=int(panel_id))
    cq.order_by(order_by).limit(limit)

    accession_items = []

    synonym_types = dict(
        EntitySynonymType.objects.filter(target_model=ContentType.objects.get_for_model(Accession)).values_list('id',
                                                                                                                'name'))

    for accession in cq:
        a = {
            'id': accession.pk,
            'name': accession.name,
            'code': accession.code,
            'primary_classification_entry': accession.primary_classification_entry_id,
            'layout': accession.layout_id,
            'descriptors': accession.descriptors,
            'synonyms': {},
            'primary_classification_entry_details': {
                'id': accession.primary_classification_entry_id,
                'name': accession.primary_classification_entry_name,
                'rank': accession.primary_classification_entry_rank_id,
            }
        }

        for synonym in accession.synonyms.all():
            synonym_type_name = synonym_types.get(synonym.synonym_type_id)
            a['synonyms'][synonym_type_name] = {
                'id': synonym.id,
                'name': synonym.name,
                'synonym_type': synonym.synonym_type_id,
                'language': synonym.language
            }

        accession_items.append(a)

    results = {
        'perms': [],
        'items': accession_items,
        'prev': cq.prev_cursor,
        'cursor': cursor,
        'next': cq.next_cursor,
    }

    return HttpResponseRest(request, results)


@RestAccessionPanelIdAccessions.def_auth_request(Method.PATCH, Format.JSON, content={
    "type": "object",
    "properties": {
        "action": {"type": "string", "enum": ['add', 'remove']},
        "selection": {
            "type": "object",
            "properties": {
                "select": {
                    "type": [
                        {
                            "type": "object",
                            "properties": {
                                "op": {"type": "string", "enum": ['in', 'notin']},
                                "term": {"type": "string"},
                                "value": {"type": "array"},
                            },
                        },
                        {
                            "type": "boolean"
                        }
                    ]
                },

            },
            "additionalProperties": {
                "from": {
                    "type": "object",
                    "properties": {
                        "content_type": {"type": "string"},
                        "id": {"type": "integer"}
                    }
                },
                "search": {"type": "object"},
                "filters": {"type": "object"}
            }
        }
    }

}, perms={
    'accession.change_accessionpanel': _("You are not allowed to modify accession panel")
})
def modify_panel_accessions(request, panel_id):
    action = request.data['action']
    selection = request.data['selection']['select']
    acc_panel = AccessionPanel.objects.get(id=int_arg(panel_id))

    from main.cursor import CursorQuery
    cq = CursorQuery(Accession)

    if request.data['selection'].get('search'):
        search = json.loads(request.GET['search'])
        cq.filter(request.data['selection'].get('search'))

    if request.data['selection'].get('filters'):
        filters = json.loads(request.GET['filters'])
        cq.filter(request.data['selection'].get('filters'))

    cq.m2m_to_array_field(
        relationship=AccessionPanel.accessions,
        selected_field='accessionpanel_id',
        from_related_field='id',
        to_related_field='accession_id',
        alias='panels'
    )

    cq.m2m_to_array_field(
        relationship=Accession.classifications_entries,
        selected_field='classification_entry_id',
        from_related_field='id',
        to_related_field='accession_id',
        alias='classifications'
    )

    cq.set_synonym_model(AccessionSynonym)

    if request.data['selection'].get('from'):
        related_entity = request.data['selection']['from']
        label, model = related_entity['content_type'].split('.')
        content_type = get_object_or_404(ContentType, app_label=label, model=model)
        model_class = content_type.model_class()
        cq.inner_join(model_class, **{model: int_arg(related_entity['id'])})

    if action == 'remove':
        try:
            with transaction.atomic():
                if isinstance(selection, bool):
                    if selection is True:
                        acc_panel.accessions.remove(*cq)

                elif selection['op'] == 'in':
                    acc_panel.accessions.remove(*cq.filter(id__in=selection['value']))

                elif selection['op'] == 'notin':
                    acc_panel.accessions.remove(*cq.filter(id__notin=selection['value']))

                acc_panel.save()

        except IntegrityError as e:
            Descriptor.integrity_except(AccessionPanel, e)

    elif action == 'add':
        try:
            with transaction.atomic():
                if isinstance(selection, bool):
                    if selection is True:
                        acc_panel.accessions.add(*cq)

                elif selection['op'] == 'in':
                    acc_panel.accessions.add(*cq.filter(id__in=selection['value']))

                elif selection['op'] == 'notin':
                    acc_panel.accessions.add(*cq.filter(id__notin=selection['value']))

                acc_panel.save()

        except IntegrityError as e:
            Descriptor.integrity_except(AccessionPanel, e)
    else:
        raise SuspiciousOperation('Invalid action')

    return HttpResponseRest(request, {})


@RestAccessionPanelSearch.def_auth_request(Method.GET, Format.JSON, ('filters',))
def search_accession_panel(request):
    """
    Quick search for an accession panel...
    """
    filters = json.loads(request.GET['filters'])

    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = request.GET.get('cursor')
    limit = results_per_page

    if cursor:
        cursor = json.loads(cursor)
        qs = AccessionPanel.objects.filter(Q(id__gt=int_arg(cursor)))
    else:
        qs = AccessionPanel.objects.all()

    # only for persistent panels
    qs = qs.filter(panel_type=PanelType.PERSISTENT.value)

    name_method = filters.get('method', 'ieq')
    if 'layout' in filters['fields']:
        layout = int_arg(filters['layout'])

        if name_method == 'ieq':
            qs = qs.filter(Q(name__iexact=filters['name']))
        elif name_method == 'icontains':
            qs = qs.filter(Q(name__icontains=filters['name']))

        qs = qs.filter(Q(layout_id=layout))
    elif 'name' in filters['fields']:
        if name_method == 'ieq':
            qs = qs.filter(name__iexact=filters['name'])
        elif name_method == 'icontains':
            qs = qs.filter(name__icontains=filters['name'])

    qs = qs.order_by('name').distinct()[:limit]

    items_list = []

    for panel in qs:
        a = {
            'id': panel.pk,
            'name': panel.name,
            'label': panel.name,
            'layout': panel.layout.pk if panel.layout else None,
            'descriptors': panel.descriptors,
        }

        items_list.append(a)

    if len(items_list) > 0:
        entity = items_list[0]
        prev_cursor = entity['id']

        entity = items_list[-1]
        next_cursor = entity['id']

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
