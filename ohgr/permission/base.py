# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
ohgr permission rest handler
"""
from django.contrib.auth.models import Permission, User, Group
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import SuspiciousOperation
from django.shortcuts import get_object_or_404
from django.utils.translation import ugettext_lazy as _

from guardian.models import UserObjectPermission

from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest


class RestPermission(RestHandler):
    regex = r'^permission/$'
    name = 'permission'


class RestPermissionUser(RestPermission):
    regex = r'^user/$'
    suffix = 'user'


class RestPermissionUserName(RestPermissionUser):
    regex = r'^(?P<username>[a-zA-Z0-9\.\-_]+)/$'
    suffix = 'name'


class RestPermissionGroup(RestPermission):
    regex = r'^group/$'
    suffix = 'group'


class RestPermissionGroupName(RestPermissionGroup):
    regex = r'^(?P<groupname>[a-zA-Z0-9\.\-_]+)/$'
    suffix = 'name'


@RestPermissionUser.def_admin_request(Method.GET, Format.JSON)
def get_users_list(request):
    users = User.objects.all()

    response = {
        'users': [],
        'result': 'success'
    }

    for user in users:
        response['users'].add({
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
            'is_active': user.is_active,
            'is_staff': user.is_staff
        })

    return HttpResponseRest(request, response)


@RestPermissionGroup.def_admin_request(Method.GET, Format.JSON)
def get_groups_list(request):
    groups = Group.objects.all()

    response = {
        'groups': [],
        'result': 'success'
    }

    for group in groups:
        response['groups'].add({
            'name': group.name,
            'num_users': group.user_set.all().count()
        })

    return HttpResponseRest(request, response)


@RestPermissionUserName.def_admin_request(Method.GET, Format.JSON)
def get_user_permissions(request, username):
    user = get_object_or_404(User, username=username)

    response = {
        'username': user.username,
        'permissions': [],
        'result': 'success'
    }

    # TODO

    return HttpResponseRest(request, response)


@RestPermissionUserName.def_admin_request(Method.POST, Format.JSON, content={
    "type": "object",
    "properties": {
        "permission": {
            "type": "object",
            "properties": {
                "permission": {"type": "string", 'minLength': 3, 'maxLength': 32},
                "content_type": {"type": "string", 'minLength': 3, 'maxLength': 64},
                "object": {"type": "string", 'minLength': 0, 'maxLength': 255},
            },
        },
    },
})
def add_user_permission(request, username):
    permission = request.data['permission']
    content_type = request.data['content_type']
    object_id = request.data['object']

    user = get_object_or_404(User, username=username)

    if not object_id:
        perm = get_object_or_404(Permission, codename=permission)
        user.user_permissions.add(perm)
        response = {'result': 'success'}
    elif object_id and content_type:
        app_label, model = content_type.split('.')
        content_type = get_object_or_404(ContentType, app_label=app_label, model=model)
        obj = get_object_or_404(content_type.model, id=object)
        UserObjectPermission.objects.assign_perm(permission, user=user, obj=obj)

        response = {'result': 'success'}
    else:
        raise SuspiciousOperation('Object or content_type is missing')

    return HttpResponseRest(request, response)


@RestPermissionUserName.def_admin_request(Method.DELETE, Format.JSON, content={
    "type": "object",
    "properties": {
        "permission": {
            "type": "object",
            "properties": {
                "permission": {"type": "string", 'minLength': 3, 'maxLength': 32},
                "content_type": {"type": "string", 'minLength': 3, 'maxLength': 64},
                "object": {"type": "string", 'minLength': 0, 'maxLength': 255},
            },
        },
    },
})
def delete_user_permission(request, username):
    permission = request.data['permission']
    content_type = request.data['content_type']
    object_id = request.data['object']

    user = get_object_or_404(User, username=username)

    if not object_id:
        perm = get_object_or_404(Permission, codename=permission)
        user.user_permissions.remove(perm)
        response = {'result': 'success'}
    elif object_id and content_type:
        app_label, model = content_type.split('.')
        content_type = get_object_or_404(ContentType, app_label=app_label, model=model)
        obj = get_object_or_404(content_type.model, id=object)
        UserObjectPermission.objects.remove_perm(permission, user=user, obj=obj)

        response = {'result': 'success'}
    else:
        raise SuspiciousOperation('Object or content_type is missing')

    return HttpResponseRest(request, response)


# TODO list, add, delete, permissions to group
# TODO add, delete, user from group
# TODO add, delete, group
