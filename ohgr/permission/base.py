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
from functools import reduce

from guardian.models import UserObjectPermission, GroupObjectPermission

from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest

from .utils import get_permissions_for
from .filters import GroupFilter, UserFilter


class RestPermission(RestHandler):
    regex = r'^permission/$'
    name = 'permission'


class RestPermissionType(RestPermission):
    regex = r'^type/$'
    suffix = 'type'


class RestPermissionUser(RestPermission):
    regex = r'^user/$'
    suffix = 'user'


class RestPermissionUserSearch(RestPermissionUser):
    regex = r'^search/$'
    suffix = 'search'


class RestPermissionUserName(RestPermissionUser):
    regex = r'^(?P<username>[a-zA-Z0-9\.\-_]+)/$'
    suffix = 'username'


class RestPermissionUserNamePermission(RestPermissionUserName):
    regex = r'^permission/$'
    suffix = 'permission'


class RestPermissionGroup(RestPermission):
    regex = r'^group/$'
    suffix = 'group'


class RestPermissionGroupSearch(RestPermissionGroup):
    regex = r'^search/$'
    suffix = 'search'


class RestPermissionGroupName(RestPermissionGroup):
    regex = r'^(?P<name>[a-zA-Z0-9\.\-_]+)/$'
    suffix = 'name'


class RestPermissionGroupNameUser(RestPermissionGroupName):
    regex = r'^user/$'
    suffix = 'user'


class RestPermissionGroupNameUserName(RestPermissionGroupNameUser):
    regex = r'^(?P<username>[a-zA-Z0-9\.\-_]+)/$'
    suffix = 'username'


class RestPermissionGroupNamePermission(RestPermissionGroupName):
    regex = r'^permission/$'
    suffix = 'permission'


@RestPermissionType.def_request(Method.GET, Format.JSON)
def get_permissions_types(request):
    """
    Get the list of permissions type in JSON
    """

    ignore_list = (
        'admin.',
        'contenttypes.',
        'guardian.',
        'main.settings.',
        'sessions.',
        'sites.',
    )

    types = []
    add = False
    for perm in Permission.objects.all().select_related('content_type'):
        pid = "%s.%s.%s" % (perm.content_type.app_label, perm.content_type.model, perm.codename)
        add = True
        for ignore_pattern in ignore_list:
            if pid.startswith(ignore_pattern):
                add = False
                break

        if add:
            types.append({'id': pid, 'value': perm.name})

    return HttpResponseRest(request, types)


@RestPermissionUser.def_auth_request(Method.GET, Format.JSON, staff=True)
def get_users_list(request):
    query = User.objects.all()

    users = []

    response = {
        'users': users,
        'perms': get_permissions_for(request.user, "auth", "user")
    }

    for user in query:
        users.append({
            'id': user.id,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
            'is_active': user.is_active,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
        })

    return HttpResponseRest(request, response)


@RestPermissionGroup.def_auth_request(Method.GET, Format.JSON, staff=True)
def get_groups_list(request):
    groups = Group.objects.all()

    response = {
        'groups': [],
        'perms': get_permissions_for(request.user, "auth", "group"),
    }

    for group in groups:
        response['groups'].append({
            'id': group.id,
            'name': group.name,
            'num_users': group.user_set.all().count(),
            'num_permissions': group.permissions.all().count(),
            'perms': get_permissions_for(request.user, "auth", "group", group),
        })

    return HttpResponseRest(request, response)


@RestPermissionGroup.def_auth_request(Method.POST, Format.JSON, staff=True, content={
    "type": "object",
    "properties": {
        "name": {"type": "string", "minLength": 3, "maxLength": 64},
    },
})
def add_group(request):
    group_name = request.data['name']

    if Group.objects.filter(name__exact=group_name).exists():
        raise SuspiciousOperation(_("Group name already in usage"))

    group = Group(name=group_name)
    group.save()

    response = {
        'id': group.id,
        'name': group_name,
        'perms': get_permissions_for(request.user, "auth", "group"),
    }

    return HttpResponseRest(request, response)


@RestPermissionGroupName.def_auth_request(Method.DELETE, Format.JSON, staff=True)
def delete_group(request, name):
    group = get_object_or_404(Group, name__exact=name)

    if group.user_set.all().count() > 0:
        raise SuspiciousOperation(_("Only empty groups can be deleted"))

    group.delete()

    return HttpResponseRest(request, {})


@RestPermissionGroupSearch.def_auth_request(Method.GET, Format.JSON, ('filters',))
def search_group(request):
    groups = GroupFilter.search(json.loads(request.GET['filters']))

    items = []

    response = {
        'total_count': groups.count(),
        'page': 1,
        'items': items
    }

    if groups:
        for g in groups:
            items.append({"id": str(g.id), "label": g.name, "value": g.name})

    return HttpResponseRest(request, response)


@RestPermissionUserSearch.def_auth_request(Method.GET, Format.JSON, ('filters',))
def search_user(request):
    users = UserFilter.search(json.loads(request.GET['filters']))

    items = []

    response = {
        'total_count': users.count(),
        'page': 1,
        'items': items
    }

    if users:
        for u in users:
            items.append({"id": str(u.id), "label": "%s (%s)" % (u.get_full_name(), u.username), "value": u.username})

    return HttpResponseRest(request, response)


class Perm:
    def __init__(self, permissions, model, object, object_name):
        self.permissions = permissions
        self.model = model
        self.object = object
        self.object_name = object_name

    def __lt__(self, other):
        if self.object_name == other.object_name:
            return self.model < other.model
        else:
            if self.object_name and other.object_name:
                return self.object_name < other.object_name
            elif not self.object_name:
                return self
            else:
                return other.object_name

    def __eq__(self, other):
        return (self.object_name == other.object_name) and (self.model == other.model)


@RestPermissionUserNamePermission.def_auth_request(Method.GET, Format.JSON, staff=True)
def get_user_permissions(request, username):
    user = get_object_or_404(User, username=username)

    permissions = []

    # from taxonomy.models import Taxon
    # content_type = ContentType.objects.get_by_natural_key('taxonomy', 'Taxon')
    # obj = get_object_or_404(Taxon, id=1)
    # UserObjectPermission.objects.assign_perm('change_taxon', user=User.objects.get(username='fscherma'), obj=obj)

    checkout = Permission.objects.filter(user=user).select_related('content_type')
    lookup = {}

    for perm in checkout:
        if perm.content_type.model in lookup:
            perms = lookup[perm.content_type.model]
        else:
            perms = []
            lookup[perm.content_type.model] = perms

        perms.append({
            'id': perm.codename,
            'name': perm.name,
            'app_label': perm.content_type.app_label,
        })

    for k, v in lookup.items():
        permissions.append(Perm(v, k, None, None))

    checkout = UserObjectPermission.objects.filter(user=user).select_related('permission', 'content_type')
    lookup = {}

    for perm in checkout:
        obj_name = perm.content_type.get_object_for_this_type(id=perm.object_pk).name

        if (perm.object_pk, perm.content_type.model, obj_name) in lookup:
            perms = lookup[(perm.object_pk, perm.content_type.model, obj_name)]
        else:
            perms = []
            lookup[(perm.object_pk, perm.content_type.model, obj_name)] = perms

        perms.append({
            'id': perm.permission.codename,
            'name': perm.permission.name,
            'app_label': perm.content_type.app_label,
        })

    for k, v in lookup.items():
        permissions.append(Perm(v, k[1], k[0], k[2]))

    permissions.sort()

    response = {
        'username': user.username,
        'permissions': permissions,
        'perms': get_permissions_for(request.user, "auth", "permission"),
    }

    return HttpResponseRest(request, response)


@RestPermissionUserName.def_admin_request(Method.PATCH, Format.JSON, content={
    "type": "object",
    "properties": {
        "is_active": {"type": "boolean", "required": False},
        "is_staff": {"type": "boolean", "required": False},
        "is_superuser": {"type": "boolean", "required": False},
    },
})
def patch_user(request, username):
    user = get_object_or_404(User, username=username)
    update = False

    if 'is_active' in request.data:
        update = True
        user.is_active = request.data['is_active']

    if 'is_staff' in request.data:
        update = True
        user.is_staff = request.data['is_staff']

    if 'is_superuser' in request.data:
        update = True
        user.is_superuser = request.data['is_superuser']

    if update:
        user.save()

    return HttpResponseRest(request, {})


@RestPermissionUserNamePermission.def_auth_request(
    Method.POST, Format.JSON, content={
        "type": "object",
        "properties": {
            "permission": {"type": "string", 'minLength': 3, 'maxLength': 32},
            "content_type": {"type": "string", 'minLength': 3, 'maxLength': 64},
            "object": {"type": "string", 'maxLength': 255, 'required': False},
        },
    },
    perms={'auth.add_permission': _("You are not allowed to add a permission")},
    staff=True)
def add_user_permission(request, username):
    permission = request.data['permission']
    content_type = request.data['content_type']
    object_id = request.data['object'] if 'object' in request.data else None

    if content_type == "auth.permission" and not request.user.is_superuser:
        raise PermissionDenied(_("Only a superuser can change an auth.permission"))

    user = get_object_or_404(User, username=username)

    app_label, model = content_type.split('.')
    # content_type = get_object_or_404(ContentType, app_label=app_label, model=model)
    content_type = ContentType.objects.get_by_natural_key(app_label, model)

    if not object_id:
        perm = get_object_or_404(Permission, codename=permission, content_type=content_type)
        user.user_permissions.add(perm)
    else:
        obj = get_object_or_404(content_type.model, id=object)
        UserObjectPermission.objects.assign_perm(permission, user=user, obj=obj)

    return HttpResponseRest(request, {})


@RestPermissionUserNamePermission.def_auth_request(
    Method.PATCH, Format.JSON, content={
        "type": "object",
        "properties": {
            "action": {"type": "string", "pattern": "^(add|remove)$"},
            "target": {"type": "string", "pattern": "^permission$"},
            "permission": {"type": "string", 'minLength': 3, 'maxLength': 32},
            "content_type": {"type": "string", 'minLength': 3, 'maxLength': 64},
            "object": {"type": "string", 'maxLength': 255, 'required': False},
        },
    },
    perms={'auth.delete_permission': _("You are not allowed to remove a permission")},
    staff=True)
def delete_user_permission(request, username):
    action = request.data['action']
    permission = request.data['permission']
    content_type = request.data['content_type']
    object_id = request.data['object'] if 'object' in request.data else None

    if content_type == "auth.permission" and not request.user.is_superuser:
        raise PermissionDenied(_("Only a superuser can change an auth.permission"))

    user = get_object_or_404(User, username=username)

    app_label, model = content_type.split('.')
    content_type = ContentType.objects.get_by_natural_key(app_label, model)

    if not object_id:
        perm = get_object_or_404(Permission, codename=permission, content_type=content_type)
        if action == "add":
            user.user_permissions.add(perm)
        elif action == "remove":
            user.user_permissions.remove(perm)
        else:
            raise SuspiciousOperation('Invalid patch action')
    else:
        obj = get_object_or_404(content_type.model, id=object)

        if action == "add":
            UserObjectPermission.objects.assign_perm(permission, user=user, obj=obj)
        elif action == "remove":
            UserObjectPermission.objects.remove_perm(permission, user=user, obj=obj)
        else:
            raise SuspiciousOperation('Invalid patch action')

    return HttpResponseRest(request, {})


@RestPermissionGroupNamePermission.def_auth_request(Method.GET, Format.JSON, staff=True)
def get_group_permissions(request, name):
    group = get_object_or_404(Group, name=name)
    permissions = []

    checkout = Permission.objects.filter(group=group).select_related('content_type')
    lookup = {}

    for perm in checkout:
        if perm.content_type.model in lookup:
            perms = lookup[perm.content_type.model]
        else:
            perms = []
            lookup[perm.content_type.model] = perms

        perms.append({
            'id': perm.codename,
            'name': perm.name,
            'app_label': perm.content_type.app_label,
        })

    for k, v in lookup.items():
        permissions.append(Perm(v, k, None, None))

    checkout = GroupObjectPermission.objects.filter(group=group).select_related('permission', 'content_type')
    lookup = {}

    for perm in checkout:
        obj_name = perm.content_type.get_object_for_this_type(id=perm.object_pk).name

        if (perm.object_pk, perm.content_type.model, obj_name) in lookup:
            perms = lookup[(perm.object_pk, perm.content_type.model, obj_name)]
        else:
            perms = []
            lookup[(perm.object_pk, perm.content_type.model, obj_name)] = perms

        perms.append({
            'id': perm.permission.codename,
            'name': perm.permission.name,
            'app_label': perm.content_type.app_label,
        })

    for k, v in lookup.items():
        permissions.append(Perm(v, k[1], k[0], k[2]))

    permissions.sort()

    response = {
        'name': name,
        'permissions': permissions,
        'perms': get_permissions_for(request.user, "auth", "permission"),
    }

    return HttpResponseRest(request, response)


@RestPermissionGroupNamePermission.def_auth_request(
    Method.POST, Format.JSON, content={
        "type": "object",
        "properties": {
            "permission": {"type": "string", 'minLength': 3, 'maxLength': 32},
            "content_type": {"type": "string", 'minLength': 3, 'maxLength': 64},
            "object": {"type": "string", 'maxLength': 255, 'required': False},
        },
    },
    perms={'auth.add_permission': _("You are not allowed to add a permission")},
    staff=True)
def add_group_permission(request, name):
    permission = request.data['permission']
    content_type = request.data['content_type']
    object_id = request.data['object'] if 'object' in request.data else None

    if content_type == "auth.permission" and not request.user.is_superuser:
        raise PermissionDenied(_("Only a superuser can change an auth.permission"))

    group = get_object_or_404(Group, name=name)

    app_label, model = content_type.split('.')
    content_type = ContentType.objects.get_by_natural_key(app_label, model)

    if not object_id:
        perm = get_object_or_404(Permission, codename=permission, content_type=content_type)
        group.permissions.add(perm)
    else:
        obj = get_object_or_404(content_type.model, id=object)
        GroupObjectPermission.objects.assign_perm(permission, group=group, obj=obj)

    return HttpResponseRest(request, {})


@RestPermissionGroupNamePermission.def_auth_request(
    Method.PATCH, Format.JSON, content={
        "type": "object",
        "properties": {
            "action": {"type": "string", "pattern": "^(add|remove)$"},
            "target": {"type": "string", "pattern": "^permission$"},
            "permission": {"type": "string", 'minLength': 3, 'maxLength': 32},
            "content_type": {"type": "string", 'minLength': 3, 'maxLength': 64},
            "object": {"type": "string", 'maxLength': 255, 'required': False},
        },
    },
    perms={'auth.delete_permission': _("You are not allowed to remove a permission")},
    staff=True)
def delete_group_permission(request, name):
    action = request.data['action']
    permission = request.data['permission']
    content_type = request.data['content_type']
    object_id = request.data['object'] if 'object' in request.data else None

    if content_type == "auth.permission" and not request.user.is_superuser:
        raise PermissionDenied(_("Only a superuser can change an auth.permission"))

    group = get_object_or_404(Group, name=name)

    app_label, model = content_type.split('.')
    content_type = ContentType.objects.get_by_natural_key(app_label, model)

    if not object_id:
        perm = get_object_or_404(Permission, codename=permission, content_type=content_type)
        if action == "add":
            group.permissions.add(perm)
        elif action == "remove":
            group.permissions.remove(perm)
        else:
            raise SuspiciousOperation('Invalid patch action')
    else:
        obj = get_object_or_404(content_type.model, id=object)

        if action == "add":
            GroupObjectPermission.objects.assign_perm(permission, group=group, obj=obj)
        elif action == "remove":
            GroupObjectPermission.objects.remove_perm(permission, group=group, obj=obj)
        else:
            raise SuspiciousOperation('Invalid patch action')

    return HttpResponseRest(request, {})


@RestPermissionGroupNameUser.def_auth_request(Method.POST, Format.JSON, content={
        "type": "object",
        "properties": {
            "username": {"type": "string", 'minLength': 3, 'maxLength': 64},
        },
    },
    perms={'auth.change_group': _("You are not allowed to add a user into a group")},
    staff=True)
def group_add_user(request, name):
    group = get_object_or_404(Group, name=name)
    user = get_object_or_404(User, username=request.data['username'])

    if user in group.user_set.all():
        raise SuspiciousOperation(_("User already exists into the group"))

    user.groups.add(group)

    response = {
        'id': user.id,
        'username': user.username,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'is_active': user.is_active,
        'is_staff': user.is_staff,
        'is_superuser': user.is_superuser,
        'email': user.email}

    return HttpResponseRest(request, response)


@RestPermissionGroupNameUserName.def_auth_request(
    Method.DELETE, Format.JSON,
    perms={'auth.change_group': _("You are not allowed to remove a user from a group")},
    staff=True)
def group_delete_user(request, name, username):
    group = get_object_or_404(Group, name=name)
    user = get_object_or_404(User, username=username)

    if user not in group.user_set.all():
        raise SuspiciousOperation(_("User does not exists into the group"))

    user.groups.remove(group)

    return HttpResponseRest(request, {})


@RestPermissionGroupNameUser.def_auth_request(Method.OPTIONS, Format.JSON, staff=True)
def opt_users_list_for_group(request, name):
    response = {
        'perms': get_permissions_for(request.user, "auth", "group")
    }

    return HttpResponseRest(request, response)


@RestPermissionGroupNameUser.def_auth_request(Method.GET, Format.JSON, staff=True)
def get_users_list_for_group(request, name):
    query = get_object_or_404(Group, name=name).user_set.all()

    users = []

    response = {
        'users': users,
        'perms': get_permissions_for(request.user, "auth", "group")
    }

    for user in query:
        users.append({
            'id': user.id,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
            'is_active': user.is_active,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
        })

    return HttpResponseRest(request, response)
