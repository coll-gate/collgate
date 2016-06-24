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

from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest


class RestAudit(RestHandler):
    regex = r'^audit/$'
    name = 'audit'


class RestAuditUserUserName(RestAudit):
    regex = r'^user/(?P<username>[a-zA-Z0-9\.\-_]+)/$'
    suffix = 'user'


class RestAuditObjectId(RestAudit):
    regex = r'^object/(?P<id>[0-9]+)/$'
    suffix = 'object'


@RestAuditUserUserName.def_auth_request(Method.GET, Format.JSON, staff=True)
def get_audit_for_user(request, username):
    pass


@RestAuditUserUserName.def_auth_request(Method.GET, Format.JSON, staff=True)
def get_audit_for_object(request, object_id):
    pass
