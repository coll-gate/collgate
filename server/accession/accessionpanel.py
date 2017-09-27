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
from descriptor.models import DescriptorMetaModel, DescriptorModelType
from igdectk.rest.handler import *
from django.db.models import Q
from igdectk.rest.response import HttpResponseRest
from django.core.exceptions import SuspiciousOperation
from django.db import transaction, IntegrityError
from django.shortcuts import get_object_or_404
# from permission.utils import get_permissions_for
from django.utils.translation import ugettext_lazy as _

from .models import AccessionPanel, Accession
from .base import RestAccession


class RestAccessionPanel(RestAccession):
    regex = r'^panel/$'
    name = "panel"


class RestAccessionPanelSearch(RestAccessionPanel):
    regex = r'^search/$'
    suffix = 'search'


class RestAccessionPanelCount(RestAccessionPanel):
    regex = r'^count/$'
    name = "count"


class RestAccessionPanelId(RestAccessionPanel):
    regex = r'^(?P<panel_id>[0-9]+)/$'
    suffix = 'id'


class RestAccessionPanelAccession(RestAccessionPanelId):
    regex = r'^accession/$'
    name = "accession"


class RestAccessionPanelAccessionCount(RestAccessionPanelAccession):
    regex = r'^count/$'
    name = "count"


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
                }
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
    dmm_id = request.data['descriptor_meta_model']
    descriptors = request.data['descriptors']

    dmm = None

    # check uniqueness of the name
    if AccessionPanel.objects.filter(name=name).exists():
        raise SuspiciousOperation(_("The name of the panel is already used"))

    if dmm_id is not None:
        content_type = get_object_or_404(ContentType, app_label="accession", model="accessionpanel")
        dmm = get_object_or_404(DescriptorMetaModel, id=int_arg(dmm_id), target=content_type)

    if related_entity:
        label, model = related_entity['content_type'].split('.')
        parent_content_type = get_object_or_404(ContentType, app_label=label, model=model)
        entity = parent_content_type.get_object_for_this_type(id=int_arg(related_entity['id']))

        related_accessions = entity.accessions
    else:
        related_accessions = Accession.objects

    try:
        with transaction.atomic():
            panel = AccessionPanel(name=name)

            panel.descriptor_meta_model = dmm

            # descriptors
            descriptors_builder = DescriptorsBuilder(panel)

            descriptors_builder.check_and_update(dmm, descriptors)
            panel.descriptors = descriptors_builder.descriptors

            panel.save()

            # update owner on external descriptors
            descriptors_builder.update_associations()

            if isinstance(selection, bool):
                if selection is True:
                    panel.accessions.add(*related_accessions.all())

            elif selection['op'] == 'in':
                panel.accessions.add(*related_accessions.filter(id__in=selection['value']))

            elif selection['op'] == 'notin':
                panel.accessions.add(*related_accessions.exclude(id__in=selection['value']))

    except IntegrityError as e:
        DescriptorModelType.integrity_except(AccessionPanel, e)

    response = {
        'id': panel.pk,
        'name': panel.name,
        'descriptor_meta_model': panel.descriptor_meta_model.pk if panel.descriptor_meta_model else None,
        'descriptors': panel.descriptors
    }

    return HttpResponseRest(request, response)


@RestAccessionPanelId.def_request(Method.GET, Format.JSON)
def get_panel(request, panel_id):
    panel = AccessionPanel.objects.get(id=int_arg(panel_id))

    results = {
        'id': panel.pk,
        'name': panel.name,
        'descriptor_meta_model': panel.descriptor_meta_model.pk if panel.descriptor_meta_model else None,
        'descriptors': panel.descriptors
    }

    return HttpResponseRest(request, results)


@RestAccessionPanelCount.def_auth_request(Method.GET, Format.JSON, perms={
    'accession.list_accessionpanel': _("You are not allowed to list the accession panels")
})
def get_panel_list_count(request):
    from main.cursor import CursorQuery
    cq = CursorQuery(AccessionPanel)

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
def get_accession_list(request):
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
            'descriptor_meta_model': panel.descriptor_meta_model.pk if panel.descriptor_meta_model else None,
            'descriptors': panel.descriptors
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
},
                                       content={
                                           "type": "object",
                                           "properties": {
                                               "name": AccessionPanel.NAME_VALIDATOR,
                                               # "entity_status": AccessionPanel.ENTITY_STATUS_VALIDATOR_OPTIONAL,
                                               "descriptor_meta_model": {"type": ["integer", "null"],
                                                                         'required': False},
                                               "descriptors": {"type": "object", "required": False},
                                           },
                                       })
def modify_panel(request, panel_id):
    panel = get_object_or_404(AccessionPanel, id=int(panel_id))
    # entity_status = request.data.get("entity_status")
    descriptors = request.data.get("descriptors")

    result = {
        'id': panel.id
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

                panel.name = name
                result['name'] = name

            if 'descriptor_meta_model' in request.data:
                dmm_id = request.data["descriptor_meta_model"]

                # changing of meta model erase all previous descriptors values
                if dmm_id is None and panel.descriptor_meta_model is not None:
                    # clean previous descriptors and owns
                    descriptors_builder = DescriptorsBuilder(panel)

                    descriptors_builder.clear(panel.descriptor_meta_model)

                    panel.descriptor_meta_model = None
                    panel.descriptors = {}

                    descriptors_builder.update_associations()

                    result['descriptor_meta_model'] = None
                    result['descriptors'] = {}

                elif dmm_id is not None:
                    # existing descriptors and new meta-model is different : first clean previous descriptors
                    if panel.descriptor_meta_model is not None and panel.descriptor_meta_model.pk != dmm_id:
                        # clean previous descriptors and owns
                        descriptors_builder = DescriptorsBuilder(panel)

                        descriptors_builder.clear(panel.descriptor_meta_model)

                        panel.descriptor_meta_model = None
                        panel.descriptors = {}

                        descriptors_builder.update_associations()

                    # and set the new one
                    content_type = get_object_or_404(ContentType, app_label="accession", model="accessionpanel")
                    dmm = get_object_or_404(DescriptorMetaModel, id=dmm_id, target=content_type)

                    panel.descriptor_meta_model = dmm
                    panel.descriptors = {}

                    result['descriptor_meta_model'] = dmm.id
                    result['descriptors'] = {}

                    panel.update_field(['descriptor_meta_model', 'descriptors'])

            if descriptors is not None:
                # update descriptors
                descriptors_builder = DescriptorsBuilder(panel)

                descriptors_builder.check_and_update(panel.descriptor_meta_model, descriptors)

                panel.descriptors = descriptors_builder.descriptors
                result['descriptors'] = panel.descriptors

                descriptors_builder.update_associations()

                panel.descriptors_diff = descriptors
                panel.update_field('descriptors')

            panel.save()
    except IntegrityError as e:
        DescriptorModelType.integrity_except(Accession, e)

    return HttpResponseRest(request, result)


# todo: set correct permissions... maybe list_panel_accession???
@RestAccessionPanelAccessionCount.def_auth_request(Method.GET, Format.JSON, perms={
    'accession.list_accession': _("You are not allowed to list the accessions")
})
def get_panel_accession_list_count(request, panel_id):
    panel = get_object_or_404(AccessionPanel, id=int(panel_id))

    results = {
        'count': panel.accessions.count()
    }

    return HttpResponseRest(request, results)


@RestAccessionPanelAccession.def_auth_request(Method.GET, Format.JSON, perms={
    'accession.list_accession': _("You are not allowed to list the accessions")
})
def get_panel_accession_list(request, panel_id):
    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = json.loads(request.GET.get('cursor', 'null'))
    limit = results_per_page
    # sort_by = json.loads(request.GET.get('sort_by', '[]'))

    panel = get_object_or_404(AccessionPanel, id=int(panel_id))

    if cursor:
        qs = panel.accessions.filter(Q(id__gt=int_arg(cursor)))
    else:
        qs = panel.accessions.all()

    qs = qs[:limit]

    accession_items = []

    for accession in qs:
        a = {
            'id': accession.pk,
            'name': accession.name,
            'code': accession.code,
            'primary_classification_entry': accession.primary_classification_entry_id,
            'descriptor_meta_model': accession.descriptor_meta_model_id,
            'descriptors': accession.descriptors,
            'synonyms': [],
            'primary_classification_entry_details': {
                'id': accession.primary_classification_entry.id,
                'name': accession.primary_classification_entry.name,
                'rank': accession.primary_classification_entry.rank_id,
            }
        }

        for synonym in accession.synonyms.all():
            a['synonyms'].append({
                'id': synonym.id,
                'name': synonym.name,
                'synonym_type': synonym.synonym_type_id,
                'language': synonym.language
            })

        accession_items.append(a)

    if len(accession_items) > 0:
        entity = accession_items[0]
        prev_cursor = entity['id']

        entity = accession_items[-1]
        next_cursor = entity['id']

    else:
        prev_cursor = None
        next_cursor = None

    results = {
        'perms': [],
        'items': accession_items,
        'prev': prev_cursor,
        'cursor': cursor,
        'next': next_cursor,
    }

    return HttpResponseRest(request, results)


@RestAccessionPanelAccession.def_auth_request(Method.POST, Format.JSON, content={
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
        }
    }

}, perms={
    'accession.change_accessionpanel': _("You are not allowed to modify accession panel")
})
def unlink_panel_accessions(request, panel_id):
    print(request)
    selection = json.loads(request.data['select'])
    panel = AccessionPanel.objects.get(id=int_arg(panel_id))

    try:
        with transaction.atomic():

            if isinstance(selection, bool):
                if selection is True:
                    panel.accessions.remove(*panel.accessions.all())

            elif selection['op'] == 'in':
                panel.accessions.remove(*panel.accessions.filter(id__in=selection['value']))

            elif selection['op'] == 'notin':
                panel.accessions.remove(*panel.accessions.exclude(id__in=selection['value']))

    except IntegrityError as e:
        DescriptorModelType.integrity_except(AccessionPanel, e)

    return HttpResponseRest(request, {'message': 'ok'})


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
        qs = AccessionPanel.objects.filter(Q(id__gt=int_arg(cursor)))
    else:
        qs = AccessionPanel.objects.all()

    name_method = filters.get('method', 'ieq')
    if 'meta_model' in filters['fields']:
        meta_model = int_arg(filters['meta_model'])

        if name_method == 'ieq':
            qs = qs.filter(Q(name__iexact=filters['name']))
        elif name_method == 'icontains':
            qs = qs.filter(Q(name__icontains=filters['name']))

        qs = qs.filter(Q(descriptor_meta_model_id=meta_model))
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
            'descriptor_meta_model': panel.descriptor_meta_model.pk if panel.descriptor_meta_model else None,
            'descriptors': panel.descriptors
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
