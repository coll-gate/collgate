# -*- coding: utf-8;-*-
#
# @file accessionpanel.py
# @brief
# @author Medhi BOULNEMOUR (INRA UMR1095)
# @date 2017-09-12
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details


from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest
from django.core.exceptions import SuspiciousOperation
from django.db import transaction
from django.shortcuts import get_object_or_404
# from permission.utils import get_permissions_for
from django.utils.translation import ugettext_lazy as _

from .models import AccessionPanel, Accession
from .base import RestAccession


class RestAccessionPanel(RestAccession):
    regex = r'^panel/$'
    name = "panel"


class RestAccessionPanelCount(RestAccessionPanel):
    regex = r'^count/$'
    name = "count"


class RestAccessionPanelId(RestAccessionPanel):
    regex = r'^(?P<panel_id>[0-9]+)/$'
    suffix = 'id'


@RestAccessionPanel.def_auth_request(Method.POST, Format.JSON, content={
    "type": "object",
    "properties": {
        "name": AccessionPanel.NAME_VALIDATOR,
        "selection": {
            "type": [
                {
                    "type": "object",
                    "properties": {
                        "op": {"enum": ['in', 'notin']},
                        "term": {"type": "string"},
                        "value": {"type": "array"},
                    }
                },
                {
                    "type": "boolean"
                }
            ],
        }
    },
}, perms={
    'accession.add_accessionpanel': _("You are not allowed to create an accession panel")
})
def create_panel(request):
    name = request.data['name']
    selection = request.data['selection']

    # check uniqueness of the code
    if AccessionPanel.objects.filter(name=name).exists():
        raise SuspiciousOperation(_("The name of the panel is already used"))

    with transaction.atomic():
        panel = AccessionPanel(name=name)
        panel.save()
        count = 0

        if isinstance(selection, bool):
            if selection is True:
                panel.accessions.add(*Accession.objects.all())
                count = Accession.objects.all().count()

        elif selection['op'] == 'in':
            panel.accessions.add(*Accession.objects.filter(id__in=selection['value']))
            count = Accession.objects.filter(id__in=selection['value']).count()

        elif selection['op'] == 'notin':
            panel.accessions.add(*Accession.objects.exclude(id__in=selection['value']))
            count = Accession.objects.exclude(id__in=selection['value']).count()

    results = {
        'message': 'ok',
        'count': count
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
            'name': panel.name
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
    print(panel_id)
    panel = get_object_or_404(AccessionPanel, id=int(panel_id))
    panel.delete()

    return HttpResponseRest(request, {})
