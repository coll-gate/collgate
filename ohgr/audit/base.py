# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
ohgr permission REST API
"""
import operator

from django.contrib.auth.models import Permission, User, Group
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import SuspiciousOperation
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils.translation import ugettext_noop as _

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


@RestAudit.def_auth_request(Method.GET, Format.JSON, staff=True)
def get_audit_list(request):
    pass


@RestAuditSearch.def_auth_request(Method.GET, Format.JSON, parameters=('username',), staff=True)
def search_audit(request):
    results_per_page = 30
    page = int_arg(request.GET.get('page', 1))
    offset = (page - 1) * results_per_page
    limit = offset + results_per_page

    user = get_object_or_404(User, username=request.GET['username'])
    qs = Audit.objects.filter(user=user)
    audits = qs.order_by('-timestamp')[offset:limit]

    audit_list = []

    # TODO page offset limit

    for audit in audits:
        audit_list.append({
            'id': audit.id,
            'user_id': user.id,
            'username': user.username,
            'timestamp': audit.timestamp,
            'object_id': audit.object_id,
            'object_name': '',
            'reason': audit.reason,
            'fields': audit.fields
        })

    results = {
        'perms': [],
        'items': audit_list,
        'total_count': qs.count(),
        'page': 1,
    }

    return HttpResponseRest(request, results)


@RestAuditSearch.def_auth_request(Method.GET, Format.JSON, parameters=('app_label', 'model', 'object_id'), staff=True)
def search_audit_for_entity(request):
    results_per_page = 30
    page = int_arg(request.GET.get('page', 1))
    offset = (page - 1) * results_per_page
    limit = offset + results_per_page
    # TODO page offset limit page = int_arg(request.GET['page'])

    app_label = request.GET['app_label']
    model = request.GET['model']
    object_id = int_arg(request.GET['object_id'])

    content_type = ContentType.objects.get_by_natural_key(app_label, model)
    entity = content_type.get_object_for_this_type(id=object_id)

    qs = Audit.objects.filter(content_type=content_type, object_id=object_id)[offset:limit]
    audits = qs.order_by('-timestamp')[offset:limit]

    audit_list = []

    for audit in audits:
        audit_list.append({
            'id': audit.id,
            'user_id': audit.user.id,
            'username': audit.user.username,
            'timestamp': audit.timestamp,
            'object_id': entity.id,
            'object_name': entity.name,
            'reason': audit.reason,
            'fields': audit.fields
        })

    results = {
        'perms': [],
        'items': audit_list,
        'total_count': qs.count(),
        'page': 1,
    }

    return HttpResponseRest(request, results)
