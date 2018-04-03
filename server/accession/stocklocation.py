# -*- coding: utf-8;-*-
#
# @file stocklocation.py
# @brief coll-gate stock location rest handler
# @author Medhi BOULNEMOUR (INRA UMR1095)
# @date 2018-03-29
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details

from accession.base import RestAccession
from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest

from accession.models import StockLocation
from permission.utils import get_permissions_for
from django.utils.translation import ugettext_lazy as _


class RestStockLocation(RestAccession):
    regex = r'^stocklocation/$'
    name = 'stocklocation'


class RestStockLocationId(RestStockLocation):
    regex = r'^(?P<location_id>[0-9]+)/$'
    suffix = 'id'


@RestStockLocationId.def_auth_request(Method.GET, Format.JSON)
def get_location_details_json(request, location_id):
    """
    Get the details of a stock location.
    """

    location = StockLocation.objects.get(id=location_id)

    # check permission on this object
    perms = get_permissions_for(request.user, location.content_type.app_label, location.content_type.model, location.pk)
    if 'accession.get_location' not in perms:
        raise PermissionDenied(_('Invalid permission to access to this stock location'))

    # todo: check if we need to return the complete list of children or if we prefere to return them by another REST method

    children = []

    for child in location.children.all():
        children.append({
            'id': child.id,
            'name': child.name,
            'label': child.get_label()
        })

    result = {
        'id': location.id,
        'name': location.name,
        'label': location.get_label(),
        'parent': {
            'id': location.parent.id,
            'name': location.parent.name,
            'label': location.parent.get_label(),
        },
        'children': children
    }

    return HttpResponseRest(request, result)


@RestStockLocation.def_auth_request(Method.GET, Format.JSON, perms={
    'accession.list_location': _("You are not allowed to list the locations")
})
def get_location_list(request):
    results_per_page = int_arg(request.GET.get('more', 0))
    cursor = json.loads(request.GET.get('cursor', 'null'))
    limit = results_per_page
    sort_by = json.loads(request.GET.get('sort_by', '[]'))
    container_location = request.GET.get('container_location', None)

    if container_location is not None:
        container_location = int(container_location)

    if not len(sort_by) or sort_by[-1] not in ('id', '+id', '-id'):
        order_by = sort_by + ['id']
    else:
        order_by = sort_by

    from main.cursor import CursorQuery
    cq = CursorQuery(StockLocation)
    cq.filter(parent_id=container_location)

    if request.GET.get('search'):
        search = json.loads(request.GET['search'])
        cq.filter(search)

    if request.GET.get('filters'):
        filters = json.loads(request.GET['filters'])
        cq.filter(filters)

    cq.cursor(cursor, order_by)
    cq.order_by(order_by).limit(limit)

    location_list = []

    for stock_location in cq:
        sl = {
            'id': stock_location.id,
            'name': stock_location.name,
            'label': stock_location.get_label(),
        }

        location_list.append(sl)

    results = {
        'perms': [],
        'items': location_list,
        'prev': cq.prev_cursor,
        'cursor': cursor,
        'next': cq.next_cursor,
    }

    return HttpResponseRest(request, results)
