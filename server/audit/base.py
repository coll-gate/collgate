# -*- coding: utf-8; -*-
#
# @file base.py
# @brief 
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2016-09-01
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

"""
coll-gate permission REST API
"""

import operator

from django.contrib.auth.models import Permission, User, Group
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import SuspiciousOperation, ObjectDoesNotExist
from django.db.models import Q
from django.shortcuts import get_object_or_404

from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest

from audit.models import Audit, Entity


class RestAudit(RestHandler):
    regex = r'^audit/$'
    name = 'audit'


class RestAuditSearch(RestAudit):
    regex = r'^search/$'
    suffix = 'search'


class RestAuditUserUserName(RestAudit):
    regex = r'^user/(?P<username>[a-zA-Z0-9\.\-_]+)/$'
    suffix = 'user-username'


class RestAuditEntityUUID(RestAudit):
    regex = r'^object/(?P<uuid>[a-zA-Z0-9]{8}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{12})/$'
    suffix = 'entity-uuid'


@RestAuditSearch.def_auth_request(Method.GET, Format.JSON, parameters=('username',), staff=True)
def search_audit_for_username(request):
    """
    Search audits entry for a specific username and ordered by timestamp.
    Infinite pagination with cursor returned by next and desc order on timestamp.

    @note This request potentially can do a lot of query in worsts cases such as querying the name directly from
    the entity itself, and more if the natural_get accessor need to perform some extra queries.
    """
    results_per_page = min(int_arg(request.GET.get('more', 30)), 100)
    cursor = request.GET.get('cursor')
    limit = results_per_page

    user = get_object_or_404(User, username=request.GET['username'])

    if cursor:
        cursor_time, cursor_id = cursor.rsplit('/', 1)
        qs = Audit.objects.filter(Q(user=user),
                                  Q(timestamp__lt=cursor_time) | (Q(timestamp=cursor_time) & Q(id__lt=cursor_id)))
    else:
        qs = Audit.objects.filter(user=user)

    audits = qs.order_by('-timestamp').order_by('-id')[:limit]

    audit_list = []

    for audit in audits:
        entity_name = ""

        try:
            entity = audit.content_type.get_object_for_this_type(id=audit.object_id)
            entity_name = entity.natural_name()
        except ObjectDoesNotExist:
            fields = json.loads(audit.fields)

            # get name in fields if the entity no longer exists, those are the common fields for name
            if 'name' in fields:
                entity_name = fields['name']
            elif 'code' in fields:
                entity_name = fields['code']
            elif 'verbose_name' in fields:
                entity_name = fields['verbose_name']
            elif 'label' in fields:
                entity_name = fields['label']

        audit_list.append({
            'id': audit.id,
            'user_id': user.id,
            'username': user.username,
            'timestamp': audit.timestamp,
            'type': audit.type,
            'content_type': '.'.join(audit.content_type.natural_key()),
            'object_id': audit.object_id,
            'object_name': entity_name,
            'fields': audit.fields
        })

    # prev/next cursor (desc order)
    if len(audit_list) > 0:
        audit = audit_list[0]
        prev_cursor = "%s/%s" % (audit['timestamp'].isoformat(), audit['id'])
        audit = audit_list[-1]
        next_cursor = "%s/%s" % (audit['timestamp'].isoformat(), audit['id'])
    else:
        prev_cursor = None
        next_cursor = None

    results = {
        'perms': [],
        'items': audit_list,
        'prev': prev_cursor,
        'cursor': cursor,
        'next': next_cursor,
    }

    return HttpResponseRest(request, results)


@RestAuditSearch.def_auth_request(Method.GET, Format.JSON, parameters=('app_label', 'model', 'object_id'), staff=True)
def search_audit_for_entity(request):
    """
    Search audit entries related to a specific entity according to its content type and unique id.
    @note Entity.natural_name() could in some cases make an extra query.
    """
    results_per_page = int_arg(request.GET.get('more', 30))

    app_label = request.GET['app_label']
    model = request.GET['model']
    object_id = int_arg(request.GET['object_id'])

    content_type = ContentType.objects.get_by_natural_key(app_label, model)
    entity = content_type.get_object_for_this_type(id=object_id)

    cursor = request.GET.get('cursor')
    limit = results_per_page

    if cursor:
        cursor_time, cursor_id = cursor.rsplit('/', 1)
        qs = Audit.objects.filter(Q(content_type=content_type),
                                  Q(object_id=object_id),
                                  Q(timestamp__lt=cursor_time) | (Q(timestamp=cursor_time) & Q(id__lt=cursor_id)))
    else:
        qs = Audit.objects.filter(content_type=content_type, object_id=object_id)

    audits = qs.order_by('-timestamp').order_by('-id')[:limit]

    audit_list = []

    for audit in audits:
        audit_list.append({
            'id': audit.id,
            'user_id': audit.user.id,
            'username': audit.user.username,
            'timestamp': audit.timestamp,
            'type': audit.type,
            'content_type': '.'.join(audit.content_type.natural_key()),
            'object_id': entity.id,
            'object_name': entity.natural_name(),
            'fields': json.loads(audit.fields)
        })

    # prev cursor (desc order)
    if len(audit_list) > 0:
        audit = audit_list[0]
        prev_cursor = "%s/%s" % (audit['timestamp'].isoformat(), audit['id'])
    else:
        prev_cursor = None

    # next cursor (desc order)
    if len(audit_list) > 0:
        audit = audit_list[-1]
        next_cursor = "%s/%s" % (audit['timestamp'].isoformat(), audit['id'])
    else:
        next_cursor = None

    results = {
        'perms': [],
        'items': audit_list,
        'prev': prev_cursor,
        'cursor': cursor,
        'next': next_cursor,
        'total_count': None
    }

    return HttpResponseRest(request, results)

