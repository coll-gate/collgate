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

from guardian.models import UserObjectPermission, GroupObjectPermission

from audit.models import Audit
from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest


class RestAudit(RestHandler):
    regex = r'^audit/$'
    name = 'audit'


class RestAuditSearch(RestAudit):
    regex = r'^search/$'
    suffix = 'search'


class RestAuditUserUserName(RestAudit):
    regex = r'^user/(?P<username>[a-zA-Z0-9\.\-_]+)/$'
    suffix = 'user'


class RestAuditObjectId(RestAudit):
    regex = r'^object/(?P<id>[0-9]+)/$'
    suffix = 'object'


@RestAudit.def_auth_request(Method.GET, Format.JSON, staff=True)
def get_audit_list(request):
    pass


@RestAuditSearch.def_auth_request(Method.GET, Format.JSON,  staff=True)
def search_audit(request):
    user = get_object_or_404(User, username=request.GET['username'])
    audits = Audit.objects.filter(user=user)

    audit_list = []

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


@RestAudit.def_auth_request(Method.GET, Format.JSON, parameters=('object_id',), staff=True)
def get_audit_for_object(request):
    pass
