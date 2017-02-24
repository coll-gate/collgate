# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
coll-gate permission REST API
"""

from django.contrib.auth.models import Permission, User, Group
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import SuspiciousOperation
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils.translation import ugettext_lazy as _
from django.views.decorators.cache import cache_page

from guardian.models import UserObjectPermission, GroupObjectPermission

from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest
from igdectk.module.manager import module_manager
from main.models import Entity

from .filters import GroupFilter, UserFilter
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


class RestPermissionGroupId(RestPermissionGroup):
    regex = r'^(?P<grp_id>[0-9]+)/$'
    suffix = 'name'


class RestPermissionGroupIdUser(RestPermissionGroupId):
    regex = r'^user/$'
    suffix = 'user'


class RestPermissionGroupIdUserName(RestPermissionGroupIdUser):
    regex = r'^(?P<username>[a-zA-Z0-9\.\-_]+)/$'
    suffix = 'username'


class RestPermissionGroupNamePermission(RestPermissionGroupId):
    regex = r'^permission/$'
    suffix = 'permission'


# Group name validator
GROUP_NAME_VALIDATOR = {"type": "string", "minLength": 3, "maxLength": 64, "pattern": "^[a-zA-Z0-9\-\_]+$"}


@RestPermissionType.def_request(Method.GET, Format.JSON)
@cache_page(60*60*24, cache='default', key_prefix='collgate-cache')
def get_permission_types(request):
    """
    Get the list of permissions type in JSON
    """
    logger.debug("Cache miss for permission.permission-type")

    ignore_list = [
        'admin.',
        'contenttypes.',
        'guardian.',
        'main.profile.',
        'main.settings.',
        'sessions.',
        'sites.',
    ]

    for module in module_manager.modules:
        if hasattr(module, 'ignored_permission_types'):
            ignore_list.extend(module.ignored_permission_types)

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
            types.append({
                'id': perm.id,
                'value': pid,
                'label': perm.name
            })

    return HttpResponseRest(request, types)


@RestPermissionUser.def_auth_request(Method.GET, Format.JSON, staff=True)
def get_users_list(request):
    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = request.GET.get('cursor')
    limit = results_per_page

    if cursor:
        cursor_username, cursor_id = cursor.rsplit('/', 1)
        qs = User.objects.filter(Q(username__gt=cursor_username))
    else:
        qs = User.objects.all()

    qs = qs.order_by('username')[:limit]

    users_list = []

    for user in qs:
        users_list.append({
            'id': user.id,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
            'is_active': user.is_active,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
            'num_permissions': user.user_permissions.all().count()
        })

    # prev/next cursor (desc order)
    if len(users_list) > 0:
        user = users_list[0]
        prev_cursor = "%s/%s" % (user['username'], user['id'])
        user = users_list[-1]
        next_cursor = "%s/%s" % (user['username'], user['id'])
    else:
        prev_cursor = None
        next_cursor = None

    response = {
        'users': users_list,
        'perms': get_permissions_for(request.user, "auth", "user"),
        'prev': prev_cursor,
        'cursor': cursor,
        'next': next_cursor
    }

    return HttpResponseRest(request, response)


@RestPermissionGroup.def_auth_request(Method.GET, Format.JSON, staff=True)
def get_groups_list(request):
    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = request.GET.get('cursor')
    limit = results_per_page

    if cursor:
        cursor_name, cursor_id = cursor.rsplit('/', 1)
        qs = Group.objects.filter(Q(name__gt=cursor_name))
    else:
        qs = Group.objects.all()

    qs = qs.order_by('name')[:limit]

    group_list = []

    for group in qs:
        group_list.append({
            'id': group.id,
            'name': group.name,
            'num_users': group.user_set.all().count(),
            'num_permissions': group.permissions.all().count(),
            'perms': get_permissions_for(request.user, "auth", "group", group),
        })

    # prev/next cursor (desc order)
    if len(group_list) > 0:
        user = group_list[0]
        prev_cursor = "%s/%s" % (user['name'], user['id'])
        user = group_list[-1]
        next_cursor = "%s/%s" % (user['name'], user['id'])
    else:
        prev_cursor = None
        next_cursor = None

    response = {
        'groups': group_list,
        'perms': get_permissions_for(request.user, "auth", "group"),
        'prev': prev_cursor,
        'cursor': cursor,
        'next': next_cursor
    }

    return HttpResponseRest(request, response)


@RestPermissionGroup.def_auth_request(Method.POST, Format.JSON, staff=True, content={
    "type": "object",
    "properties": {
        "name": GROUP_NAME_VALIDATOR
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
        'num_users': 0,
        'num_permissions': 0,
        'perms': get_permissions_for(request.user, "auth", "group"),
    }

    return HttpResponseRest(request, response)


@RestPermissionGroupId.def_auth_request(Method.GET, Format.JSON)
def get_group_details(request, grp_id):
    group = get_object_or_404(Group, id=int(grp_id))

    result = {
        'id': group.id,
        'name': group.name,
        'num_users': group.user_set.all().count(),
        'num_permissions': group.permissions.all().count(),
        'perms': get_permissions_for(request.user, "auth", "group", group),
    }

    return HttpResponseRest(request, result)


@RestPermissionGroupId.def_auth_request(Method.DELETE, Format.JSON, staff=True)
def delete_group(request, grp_id):
    group = get_object_or_404(Group, id=int(grp_id))

    if group.user_set.all().count() > 0:
        raise SuspiciousOperation(_("Only empty groups can be deleted"))

    group.delete()

    return HttpResponseRest(request, {})


@RestPermissionGroupId.def_auth_request(
    Method.PATCH, Format.JSON, content={
        "type": "object",
        "properties": {
            "name": GROUP_NAME_VALIDATOR
        },
    },
    staff=True)
def patch_group(request, grp_id):
    group = get_object_or_404(Group, id=int(grp_id))
    group_name = request.data['name']

    if group_name == group.name:
        return HttpResponseRest(request, {})

    if Group.objects.filter(name__exact=group_name).exists():
        raise SuspiciousOperation(_("Group name already in usage"))

    group.name = group_name

    group.full_clean()
    group.save()

    result = {
        'id': group.id,
        'name': group.name,
        'perms': get_permissions_for(request.user, "auth", "group")
    }

    return HttpResponseRest(request, result)


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
    def __init__(self, permissions, model, obj, object_name):
        self.permissions = permissions
        self.model = model
        self.object = obj
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
            "permission": Entity.PERMISSION_VALIDATOR,
            "content_type": Entity.CONTENT_TYPE_VALIDATOR,
            "object": {"type": "integer", 'required': False},
        },
    },
    perms={'auth.add_permission': _("You are not allowed to add a permission")},
    staff=True)
def add_user_permission(request, username):
    permission = request.data['permission']
    content_type = request.data['content_type']
    object_id = int(request.data['object']) if 'object' in request.data else None

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
        obj = get_object_or_404(content_type.model, id=object_id)
        UserObjectPermission.objects.assign_perm(permission, user=user, obj=obj)

    return HttpResponseRest(request, {})


@RestPermissionUserNamePermission.def_auth_request(
    Method.PATCH, Format.JSON, content={
        "type": "object",
        "properties": {
            "action": {"type": "string", "pattern": "^(add|remove)$"},
            "target": {"type": "string", "pattern": "^permission$"},
            "permission": Entity.PERMISSION_VALIDATOR,
            "content_type": Entity.CONTENT_TYPE_VALIDATOR,
            "object": {"type": "integer", 'required': False},
        },
    },
    perms={'auth.delete_permission': _("You are not allowed to remove a permission")},
    staff=True)
def delete_user_permission(request, username):
    action = request.data['action']
    permission = request.data['permission']
    content_type = request.data['content_type']
    object_id = int(request.data['object']) if 'object' in request.data else None

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
        obj = get_object_or_404(content_type.model, id=object_id)

        if action == "add":
            UserObjectPermission.objects.assign_perm(permission, user=user, obj=obj)
        elif action == "remove":
            UserObjectPermission.objects.remove_perm(permission, user=user, obj=obj)
        else:
            raise SuspiciousOperation('Invalid patch action')

    return HttpResponseRest(request, {})


@RestPermissionGroupNamePermission.def_auth_request(Method.GET, Format.JSON, staff=True)
def get_group_permissions(request, grp_id):
    group = get_object_or_404(Group, id=int(grp_id))
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
        'id': group.id,
        'name': group.name,
        'permissions': permissions,
        'perms': get_permissions_for(request.user, "auth", "permission"),
    }

    return HttpResponseRest(request, response)


@RestPermissionGroupNamePermission.def_auth_request(
    Method.POST, Format.JSON, content={
        "type": "object",
        "properties": {
            "permission": Entity.PERMISSION_VALIDATOR,
            "content_type": Entity.CONTENT_TYPE_VALIDATOR,
            "object": {"type": "integer", 'required': False},
        },
    },
    perms={'auth.add_permission': _("You are not allowed to add a permission")},
    staff=True)
def add_group_permission(request, grp_id):
    permission = request.data['permission']
    content_type = request.data['content_type']
    object_id = int(request.data['object']) if 'object' in request.data else None

    if content_type == "auth.permission" and not request.user.is_superuser:
        raise PermissionDenied(_("Only a superuser can change an auth.permission"))

    group = get_object_or_404(Group, id=int(grp_id))

    app_label, model = content_type.split('.')
    content_type = ContentType.objects.get_by_natural_key(app_label, model)

    if not object_id:
        perm = get_object_or_404(Permission, codename=permission, content_type=content_type)
        group.permissions.add(perm)
    else:
        obj = get_object_or_404(content_type.model, id=object_id)
        GroupObjectPermission.objects.assign_perm(permission, group=group, obj=obj)

    return HttpResponseRest(request, {})


@RestPermissionGroupNamePermission.def_auth_request(
    Method.PATCH, Format.JSON, content={
        "type": "object",
        "properties": {
            "action": {"type": "string", "pattern": "^(add|remove)$"},
            "target": {"type": "string", "pattern": "^permission$"},
            "permission": Entity.PERMISSION_VALIDATOR,
            "content_type": Entity.CONTENT_TYPE_VALIDATOR,
            "object": {"type": "integer", 'required': False},
        },
    },
    perms={'auth.delete_permission': _("You are not allowed to remove a permission")},
    staff=True)
def delete_group_permission(request, grp_id):
    action = request.data['action']
    permission = request.data['permission']
    content_type = request.data['content_type']
    object_id = int(request.data['object']) if 'object' in request.data else None

    if content_type == "auth.permission" and not request.user.is_superuser:
        raise PermissionDenied(_("Only a superuser can change an auth.permission"))

    group = get_object_or_404(Group, id=int(grp_id))

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
        obj = get_object_or_404(content_type.model, id=object_id)

        if action == "add":
            GroupObjectPermission.objects.assign_perm(permission, group=group, obj=obj)
        elif action == "remove":
            GroupObjectPermission.objects.remove_perm(permission, group=group, obj=obj)
        else:
            raise SuspiciousOperation('Invalid patch action')

    return HttpResponseRest(request, {})


@RestPermissionGroupIdUser.def_auth_request(Method.POST, Format.JSON, content={
        "type": "object",
        "properties": {
            "username": {"type": "string", 'minLength': 3, 'maxLength': 150},
        },
    },
    perms={'auth.change_group': _("You are not allowed to add a user into a group")},
    staff=True)
def group_add_user(request, grp_id):
    group = get_object_or_404(Group, id=int(grp_id))
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


@RestPermissionGroupIdUserName.def_auth_request(
    Method.DELETE, Format.JSON,
    perms={'auth.change_group': _("You are not allowed to remove a user from a group")},
    staff=True)
def group_delete_user(request, grp_id, username):
    group = get_object_or_404(Group, id=int(grp_id))
    user = get_object_or_404(User, username=username)

    if user not in group.user_set.all():
        raise SuspiciousOperation(_("User does not exists into the group"))

    user.groups.remove(group)

    return HttpResponseRest(request, {})


@RestPermissionGroupIdUser.def_auth_request(Method.GET, Format.JSON, staff=True)
def get_users_list_for_group(request, grp_id):
    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = request.GET.get('cursor')
    limit = results_per_page

    group = get_object_or_404(Group, id=int(grp_id))
    users = group.user_set

    if cursor:
        cursor_username, cursor_id = cursor.rsplit('/', 1)
        qs = users.filter(Q(username__gt=cursor_username))
    else:
        qs = users.all()

    qs = qs.order_by('username')[:limit]

    users_list = []

    for user in qs:
        users_list.append({
            'id': user.id,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
            'is_active': user.is_active,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
        })

    # prev/next cursor (desc order)
    if len(users_list) > 0:
        user = users_list[0]
        prev_cursor = "%s/%s" % (user['username'], user['id'])
        user = users_list[-1]
        next_cursor = "%s/%s" % (user['username'], user['id'])
    else:
        prev_cursor = None
        next_cursor = None

    response = {
        'users': users_list,
        'perms': get_permissions_for(request.user, "auth", "group", group),
        'prev': prev_cursor,
        'cursor': cursor,
        'next': next_cursor
    }

    return HttpResponseRest(request, response)
