# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
ohgr permission REST API
"""
from django.contrib.auth.models import Permission, User, Group
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import SuspiciousOperation
from django.shortcuts import get_object_or_404
from django.utils.translation import ugettext_noop as _

from guardian.models import UserObjectPermission

from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest

from .utils import get_permissions_for


class RestPermission(RestHandler):
    regex = r'^permission/$'
    name = 'permission'


class RestPermissionType(RestPermission):
    regex = r'^type/$'
    suffix = 'type'


class RestPermissionUser(RestPermission):
    regex = r'^user/$'
    suffix = 'user'


class RestPermissionUserName(RestPermissionUser):
    regex = r'^(?P<username>[a-zA-Z0-9\.\-_]+)/$'
    suffix = 'username'


class RestPermissionUserNamePermission(RestPermissionUserName):
    regex = r'^permission/$'
    suffix = 'permission'


class RestPermissionGroup(RestPermission):
    regex = r'^group/$'
    suffix = 'group'


class RestTaxonomyGroupSearch(RestPermissionGroup):
    regex = r'^search/$'
    suffix = 'search'


class RestPermissionGroupName(RestPermissionGroup):
    regex = r'^(?P<name>[a-zA-Z0-9\.\-_]+)/$'
    suffix = 'name'


class RestPermissionGroupNameUser(RestPermissionGroupName):
    regex = r'^user/$'
    suffix = 'user'


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
        'result': 'success',
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
        'result': 'success',
        'perms': get_permissions_for(request.user, "auth", "group"),
    }

    for group in groups:
        response['groups'].append({
            'name': group.name,
            'num_users': group.user_set.all().count(),
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
        'result': 'success',
        'perms': get_permissions_for(request.user, "auth", "group"),
    }

    return HttpResponseRest(request, response)


@RestPermissionGroupName.def_auth_request(Method.DELETE, Format.JSON, staff=True)
def delete_group(request, name):
    group = get_object_or_404(Group, name__exact=name)

    if group.user_set.all().count() > 0:
        raise SuspiciousOperation(_("Only empty groups can be deleted"))

    group.delete()

    response = {
        'result': 'success',
    }

    return HttpResponseRest(request, response)


@RestTaxonomyGroupSearch.def_auth_request(Method.GET, Format.JSON, ('term', 'type', 'mode'))
def search_group(request):
    groups = None

    if request.GET['mode'] == 'ieq' and request.GET['type'] == 'name':
        groups = Group.objects.filter(name__iexact=request.GET['term'])
    elif request.GET['mode'] == 'icontains' and request.GET['type'] == 'name':
        groups = Group.objects.filter(name__icontains=request.GET['term'])

    response = []

    if groups:
        for g in groups:
            response.append({"id": str(g.id), "label": g.name, "value": g.name})

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


@RestPermissionUserName.def_auth_request(Method.GET, Format.JSON, staff=True)
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
        'result': 'success'
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

    response = {'result': 'success'}

    return HttpResponseRest(request, response)


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
        response = {'result': 'success'}
    else:
        obj = get_object_or_404(content_type.model, id=object)
        UserObjectPermission.objects.assign_perm(permission, user=user, obj=obj)
        response = {'result': 'success'}

    return HttpResponseRest(request, response)


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
    # content_type = get_object_or_404(ContentType, app_label=app_label, model=model)
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

    response = {'result': 'success'}
    return HttpResponseRest(request, response)


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

    checkout = UserObjectPermission.objects.filter(group=group).select_related('permission', 'content_type')
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
        'perms': get_permissions_for(group, "auth", "permission"),
        'result': 'success'
    }

    return HttpResponseRest(request, response)


# TODO list, add, delete, permissions to group
# TODO add, delete, user from group
# TODO add, delete, group
