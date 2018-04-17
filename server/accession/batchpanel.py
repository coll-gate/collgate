# -*- coding: utf-8;-*-
#
# @file batchpanel.py
# @brief
# @author Medhi BOULNEMOUR (INRA UMR1095)
# @date 2017-11-07
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details

from descriptor.describable import DescriptorsBuilder
from django.contrib.contenttypes.models import ContentType
from descriptor.models import Layout, Descriptor
from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest
from django.db.models import Q
from django.core.exceptions import SuspiciousOperation
from django.db import transaction, IntegrityError
from django.shortcuts import get_object_or_404
from django.utils.translation import ugettext_lazy as _

from .models import BatchPanel, Batch, PanelType
from .base import RestAccession
from .batch import RestBatchId


class RestBatchPanel(RestAccession):
    regex = r'^batchpanel/$'
    name = "batchpanel"


class RestBatchPanelSearch(RestBatchPanel):
    regex = r'^search/$'
    suffix = 'search'


class RestBatchPanelCount(RestBatchPanel):
    regex = r'^count/$'
    name = "count"


class RestBatchPanelId(RestBatchPanel):
    regex = r'^(?P<panel_id>[0-9]+)/$'
    suffix = 'id'


class RestBatchPanelIdBatches(RestBatchPanelId):
    regex = r'^batches/$'
    name = "batches"


class RestBatchPanelIdBatchesCount(RestBatchPanelIdBatches):
    regex = r'^count/$'
    name = "count"


class RestBatchIdPanels(RestBatchId):
    regex = r'^panels/$'
    suffix = 'panels'


class RestBatchIdPanelsCount(RestBatchIdPanels):
    regex = r'^count/$'
    name = "count"


@RestBatchPanel.def_auth_request(Method.GET, Format.JSON, perms={
    'accession.list_batchpanel': _("You are not allowed to list the batch panels")
})
def get_panel_list(request):
    """
    List the persistent panels
    """
    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = json.loads(request.GET.get('cursor', 'null'))
    limit = results_per_page
    sort_by = json.loads(request.GET.get('sort_by', '[]'))

    if not len(sort_by) or sort_by[-1] not in ('id', '+id', '-id'):
        order_by = sort_by + ['id']
    else:
        order_by = sort_by

    from main.cursor import CursorQuery
    cq = CursorQuery(BatchPanel)

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
            'batches_amount': panel.batches.count()
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


@RestBatchPanel.def_auth_request(Method.POST, Format.JSON, content={
    "type": "object",
    "properties": {
        "name": BatchPanel.NAME_VALIDATOR,
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
    'accession.add_batchpanel': _("You are not allowed to create a batch panel")
})
def create_batch_panel(request):
    name = request.data['name']
    selection = request.data['selection']['select']
    related_entity = request.data['selection']['from']
    search = request.data['selection']['search']
    filters = request.data['selection']['filters']
    layout_id = request.data['layout']
    descriptors = request.data['descriptors']

    layout = None

    # check uniqueness of the name
    if BatchPanel.objects.filter(name=name).exists():
        raise SuspiciousOperation(_("The name of the panel is already used"))

    if layout_id is not None:
        content_type = get_object_or_404(ContentType, app_label="accession", model="batchpanel")
        layout = get_object_or_404(Layout, id=int_arg(layout_id), target=content_type)

    from main.cursor import CursorQuery
    cq = CursorQuery(Batch)

    if search:
        cq.filter(search)

    if filters:
        cq.filter(filters)

    if related_entity:
        label, model = related_entity['content_type'].split('.')
        content_type = get_object_or_404(ContentType, app_label=label, model=model)
        model_class = content_type.model_class()
        cq.inner_join(model_class, **{model: int_arg(related_entity['id'])})

    try:
        with transaction.atomic():
            batch_panel = BatchPanel(name=name)
            batch_panel.panel_type = PanelType.PERSISTENT.value
            batch_panel.layout = layout
            batch_panel.count = 0

            # descriptors
            descriptors_builder = DescriptorsBuilder(batch_panel)

            if layout:
                descriptors_builder.check_and_update(layout, descriptors)
                batch_panel.descriptors = descriptors_builder.descriptors

            batch_panel.save()

            # update owner on external descriptors
            descriptors_builder.update_associations()

            if isinstance(selection, bool):
                if selection is True:
                    batch_panel.batches.add(*cq)
                    batch_panel.count = cq.count()

            elif selection['op'] == 'in':
                batch_panel.batches.add(*cq.filter(id__in=selection['value']))
                batch_panel.count = cq.filter(id__in=selection['value']).count()

            elif selection['op'] == 'notin':
                batch_panel.batches.add(*cq.filter(id__notin=selection['value']))
                batch_panel.count = cq.filter(id__notin=selection['value']).count()

    except IntegrityError as e:
        Descriptor.integrity_except(BatchPanel, e)

    response = {
        'id': batch_panel.pk,
        'name': batch_panel.name,
        'layout': batch_panel.layout.pk if batch_panel.layout else None,
        'descriptors': batch_panel.descriptors,
        'batches_amount': batch_panel.count
    }

    return HttpResponseRest(request, response)


@RestBatchPanelId.def_request(Method.GET, Format.JSON)
def get_batch_panel(request, panel_id):
    panel = BatchPanel.objects.get(id=int_arg(panel_id))

    results = {
        'id': panel.pk,
        'name': panel.name,
        'layout': panel.layout.pk if panel.layout else None,
        'descriptors': panel.descriptors,
        'batches_amount': panel.batches.count()
    }

    return HttpResponseRest(request, results)


@RestBatchPanelId.def_auth_request(Method.PATCH, Format.JSON, content={
   "type": "object",
   "properties": {
       "layout": {"type": ["integer", "null"], 'required': False},
       "descriptors": {"type": "object", "required": False},
   },
   "additionalProperties": {
       "name": BatchPanel.NAME_VALIDATOR
   }
}, perms={
    'accession.change_batchpanel': _("You are not allowed to modify batch panel")
})
def modify_panel(request, panel_id):
    panel = get_object_or_404(BatchPanel, id=int(panel_id))
    descriptors = request.data.get("descriptors")

    result = {
        'id': panel.id
    }

    try:
        with transaction.atomic():
            if 'name' in request.data:
                name = request.data['name']

                if BatchPanel.objects.filter(name=name).exists():
                    raise SuspiciousOperation(_("The name of the panel is already used"))

                panel.name = name
                result['name'] = name

                panel.update_field('name')

            if 'layout' in request.data:
                layout_id = request.data["layout"]

                # changing of layout erase all previous descriptors values
                if layout_id is None and panel.layout is not None:
                    # clean previous descriptors and owns
                    descriptors_builder = DescriptorsBuilder(panel)

                    descriptors_builder.clear(panel.layout)

                    panel.layout = None
                    panel.descriptors = {}

                    descriptors_builder.update_associations()

                    result['layout'] = None
                    result['descriptors'] = {}

                    panel.update_field(['layout', 'descriptors'])

                elif layout_id is not None:
                    # existing descriptors and new layout is different : first clean previous descriptors
                    if panel.layout is not None and panel.layout.pk != layout_id:
                        # clean previous descriptors and owns
                        descriptors_builder = DescriptorsBuilder(panel)

                        descriptors_builder.clear(panel.layout)

                        panel.layout = None
                        panel.descriptors = {}

                        descriptors_builder.update_associations()

                    # and set the new one
                    content_type = get_object_or_404(ContentType, app_label="accession", model="batchpanel")
                    layout = get_object_or_404(Layout, id=layout_id, target=content_type)

                    panel.layout = layout
                    panel.descriptors = {}

                    result['layout'] = layout.id
                    result['descriptors'] = {}

                    panel.update_field(['layout', 'descriptors'])

            if descriptors is not None:
                # update descriptors
                descriptors_builder = DescriptorsBuilder(panel)

                descriptors_builder.check_and_update(panel.layout, descriptors)

                panel.descriptors = descriptors_builder.descriptors
                result['descriptors'] = panel.descriptors

                descriptors_builder.update_associations()

                panel.update_descriptors(descriptors_builder.changed_descriptors())
                panel.update_field('descriptors')

            panel.save()
    except IntegrityError as e:
        Descriptor.integrity_except(Batch, e)

    return HttpResponseRest(request, result)


@RestBatchPanelCount.def_auth_request(Method.GET, Format.JSON, perms={
    'accession.list_batchpanel': _("You are not allowed to list the batch panels")
})
def get_panel_list_count(request):
    """
    Count the list of persistent panels
    """
    from main.cursor import CursorQuery
    cq = CursorQuery(BatchPanel)

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


@RestBatchPanelSearch.def_auth_request(Method.GET, Format.JSON, ('filters',))
def search_batch_panel(request):
    """
    Quick search for a persistent batch panel.
    """
    filters = json.loads(request.GET['filters'])

    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = request.GET.get('cursor')
    limit = results_per_page

    if cursor:
        cursor = json.loads(cursor)
        qs = BatchPanel.objects.filter(Q(id__gt=int_arg(cursor)))
    else:
        qs = BatchPanel.objects.all()

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


@RestBatchPanelIdBatches.def_auth_request(Method.GET, Format.JSON, perms={
    'accession.list_batch': _("You are not allowed to list the batches")
})
def get_panel_id_batch_list(request, panel_id):
    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = json.loads(request.GET.get('cursor', 'null'))
    limit = results_per_page
    sort_by = json.loads(request.GET.get('sort_by', '[]'))

    if not len(sort_by) or sort_by[-1] not in ('id', '+id', '-id'):
        order_by = sort_by + ['id']
    else:
        order_by = sort_by

    from main.cursor import CursorQuery
    cq = CursorQuery(Batch)

    # only for persistent panels
    cq.filter(panel_type=PanelType.PERSISTENT.value)

    if request.GET.get('search'):
        search = json.loads(request.GET['search'])
        cq.filter(search)

    if request.GET.get('filters'):
        filters = json.loads(request.GET['filters'])
        cq.filter(filters)

    cq.cursor(cursor, order_by)
    cq.inner_join(BatchPanel, batchpanel=int(panel_id))
    cq.order_by(order_by).limit(limit)

    batch_items = []

    for batch in cq:
        b = {
            'id': batch.pk,
            'name': batch.name,
            'accession': batch.accession_id,
            'layout': batch.layout_id,
            'descriptors': batch.descriptors,
        }

        batch_items.append(b)

    results = {
        'perms': [],
        'items': batch_items,
        'prev': cq.prev_cursor,
        'cursor': cursor,
        'next': cq.next_cursor,
    }

    return HttpResponseRest(request, results)


@RestBatchPanelIdBatches.def_auth_request(Method.PATCH, Format.JSON, content={
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
    'accession.change_batchpanel': _("You are not allowed to modify batch panel")
})
def modify_panel_batches(request, panel_id):
    action = request.data['action']
    selection = request.data['selection']['select']
    panel = BatchPanel.objects.get(id=int_arg(panel_id))

    from main.cursor import CursorQuery
    cq = CursorQuery(Batch)

    if request.data['selection'].get('filters'):
        cq.filter(request.data['selection'].get('filters'))

    if request.data['selection'].get('search'):
        cq.filter(request.data['selection'].get('search'))

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
                        panel.batches.remove(*cq)

                elif selection['op'] == 'in':
                    panel.batches.remove(*cq.filter(id__in=selection['value']))

                elif selection['op'] == 'notin':
                    panel.batches.remove(*cq.filter(id__notin=selection['value']))

                panel.save()

        except IntegrityError as e:
            Descriptor.integrity_except(BatchPanel, e)

    elif action == 'add':
        try:
            with transaction.atomic():
                if isinstance(selection, bool):
                    if selection is True:
                        panel.batches.add(*cq)

                elif selection['op'] == 'in':
                    panel.batches.add(*cq.filter(id__in=selection['value']))

                elif selection['op'] == 'notin':
                    panel.batches.add(*cq.filter(id__notin=selection['value']))

                panel.save()

        except IntegrityError as e:
            Descriptor.integrity_except(BatchPanel, e)
    else:
        raise SuspiciousOperation('Invalid action')

    return HttpResponseRest(request, {})


# todo: set correct permissions... maybe list_panel_accession???
@RestBatchPanelIdBatchesCount.def_auth_request(Method.GET, Format.JSON, perms={
    'accession.list_batch': _("You are not allowed to list the batches")
})
def get_panel_id_batch_list_count(request, panel_id):
    from main.cursor import CursorQuery
    cq = CursorQuery(Batch)

    # only for persistent panels
    cq.filter(panel_type=PanelType.PERSISTENT.value)

    if request.GET.get('filters'):
        filters = json.loads(request.GET['filters'])
        cq.filter(filters)

    cq.inner_join(BatchPanel, batchpanel=int(panel_id))

    results = {
        'count': cq.count()
    }

    return HttpResponseRest(request, results)


@RestBatchIdPanels.def_auth_request(Method.GET, Format.JSON)
def get_batch_id_panels(request, bat_id):
    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = json.loads(request.GET.get('cursor', 'null'))
    limit = results_per_page
    sort_by = json.loads(request.GET.get('sort_by', '[]'))

    if not len(sort_by) or sort_by[-1] not in ('id', '+id', '-id'):
        order_by = sort_by + ['id']
    else:
        order_by = sort_by

    batch = Batch.objects.get(id=int(bat_id))
    panels = list(batch.panels.all().values_list('id', flat=True))

    from main.cursor import CursorQuery
    cq = CursorQuery(BatchPanel)
    cq.filter(id__in=panels)

    # only for persistent panels
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
            'batches_amount': panel.batches.count()
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


@RestBatchIdPanelsCount.def_auth_request(Method.GET, Format.JSON)
def count_batch_id_panels(request, bat_id):
    batch = Batch.objects.get(id=int(bat_id))
    panels = list(batch.panels.all().values_list('id', flat=True))

    from main.cursor import CursorQuery
    cq = CursorQuery(BatchPanel)
    cq.filter(id__in=panels)

    # only for persistent panels
    cq.filter(panel_type=PanelType.PERSISTENT.value)

    if request.GET.get('filters'):
        filters = json.loads(request.GET['filters'])
        cq.filter(filters)

    results = {
        'count': cq.count()
    }

    return HttpResponseRest(request, results)


@RestBatchPanelId.def_auth_request(Method.DELETE, Format.JSON, perms={
    'accession.delete_batchpanel': _("You are not allowed to delete batch panel")
})
def delete_panel(request, panel_id):
    panel = get_object_or_404(BatchPanel, id=int(panel_id))
    panel.delete()

    return HttpResponseRest(request, {})
