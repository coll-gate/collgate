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


class RestAuditEntityID(RestAudit):
    regex = r'^object/(?P<uuid>[a-zA-Z0-9]{8}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{12})/$'
    suffix = 'entity-uuid'


@RestAudit.def_auth_request(Method.GET, Format.JSON, staff=True)
def get_audit_list(request):
    pass


@RestAuditSearch.def_auth_request(Method.GET, Format.JSON, parameters=('username',), staff=True)
def search_audit(request):
    user = get_object_or_404(User, username=request.GET['username'])
    audits = Audit.objects.filter(user=user)

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
        'audits': audit_list
    }

    return HttpResponseRest(request, results)


@RestAuditEntityID.def_auth_request(Method.GET, Format.JSON, parameters=('app_label', 'model', 'object_id'), staff=True)
def search_audit_for_entity(request):
    filters = json.loads(request.GET['filters'])
    # TODO page offset limit page = int_arg(request.GET['page'])

    app_label = filters.get('app_label', 'main')
    model = filters.get('models', '')
    object_id = int_arg(filters.get('object_id', -1))

    content_type = ContentType.objects.get_by_natural_key(app_label, model)
    entity = get_object_or_404(Entity, id=object_id)
    audits = Audit.objects.filter(content_type=content_type, object_id=entity.id)

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
        'audits': audit_list
    }

    return HttpResponseRest(request, results)
