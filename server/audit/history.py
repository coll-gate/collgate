# -*- coding: utf-8; -*-
#
# @file Value history for an entity
# @brief collgate 
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2017-11-14
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details

import json

import validictory
from django.contrib.contenttypes.models import ContentType
from django.db.models import Q

from igdectk.common.helpers import int_arg
from igdectk.rest import Method, Format
from igdectk.rest.response import HttpResponseRest
from main.models import Entity

from .base import RestAuditSearch
from .models import Audit, AuditType


class RestAuditSearchHistory(RestAuditSearch):
    regex = r'^history/$'
    suffix = 'history'


class RestAuditSearchHistoryValue(RestAuditSearchHistory):
    regex = r'^value/$'
    suffix = 'value'


@RestAuditSearchHistoryValue.def_auth_request(Method.GET, Format.JSON, parameters=(
        'app_label', 'model', 'object_id', 'value')
                                              )
def search_audit_value_history_for_entity(request):
    """
    Search audit entries related to a specific entity according to its content type and unique id.
    And returns history for a specific value_name.
    @note Entity.natural_name() could in some cases make an extra query.
    """
    results_per_page = int_arg(request.GET.get('more', 30))

    app_label = request.GET['app_label']
    validictory.validate(app_label, Entity.NAME_VALIDATOR)

    model = request.GET['model']
    validictory.validate(model, Entity.NAME_VALIDATOR)

    object_id = int_arg(request.GET['object_id'])

    value_name = request.GET['value']

    if value_name.startswith('#'):
        value_name = value_name[1:]
        is_descriptor = True
    else:
        is_descriptor = False

    content_type = ContentType.objects.get_by_natural_key(app_label, model)

    validictory.validate(value_name, content_type.NAME_VALIDATOR)

    entity = content_type.get_object_for_this_type(id=object_id)
    # @todo check permissions

    cursor = request.GET.get('cursor')
    limit = results_per_page

    if cursor:
        cursor = json.loads(cursor)
        cursor_time, cursor_id = cursor
        qs = Audit.objects.filter(Q(content_type=content_type),
                                  Q(object_id=object_id),
                                  Q(timestamp__lt=cursor_time) | (Q(timestamp=cursor_time) & Q(id__lt=cursor_id)))
    else:
        qs = Audit.objects.filter(content_type=content_type, object_id=object_id)

    # interested in change of value so update and create only
    qs = qs.filter(type__in=[AuditType.UPDATE, AuditType.CREATE])

    audits = qs.order_by('-timestamp').order_by('-id')[:limit]

    audit_list = []

    for audit in audits:
        if audit.type == AuditType.CREATE.value:
            if is_descriptor:
                descriptors = audit.fields.get("descriptors")
                if descriptors is None:
                    continue

                if value_name not in descriptors:
                    continue

                value = descriptors.get(value_name)
            else:
                if value_name not in audit.fields:
                    continue

                value = audit.fields.get(value_name)

        elif "descriptors" in audit.fields.get("updated_fields", []):
            if is_descriptor:
                descriptors = audit.fields.get("descriptors")
                if descriptors is None:
                    continue

                if value_name not in descriptors:
                    continue

                value = descriptors.get(value_name)
            else:
                if value_name not in audit.fields:
                    continue

                value = audit.fields.get(value_name)
        else:
            continue

        audit_list.append({
            'id': audit.id,
            'user_id': audit.user.id,
            'username': audit.user.username,
            'timestamp': audit.timestamp,
            'type': audit.type,
            'value': value
        })

    # prev cursor (desc order)
    if len(audit_list) > 0:
        audit = audit_list[0]
        prev_cursor = (audit['timestamp'].isoformat(), audit['id'])
    else:
        prev_cursor = None

    # next cursor (desc order)
    if len(audit_list) > 0:
        audit = audit_list[-1]
        next_cursor = (audit['timestamp'].isoformat(), audit['id'])
    else:
        next_cursor = None

    results = {
        'perms': [],
        'items': audit_list,
        'prev': prev_cursor,
        'cursor': cursor,
        'next': next_cursor
    }

    return HttpResponseRest(request, results)
