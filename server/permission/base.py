# -*- coding: utf-8; -*-
#
# @file base.py
# @brief coll-gate permission REST API
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2016-09-01
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

from django.contrib.auth.models import Permission, User, Group
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import SuspiciousOperation
from django.db import transaction
from django.db.models import Q, Count
from django.shortcuts import get_object_or_404
from django.utils.translation import ugettext_lazy as _
from django.views.decorators.cache import cache_page

from guardian.models import UserObjectPermission, GroupObjectPermission
from guardian.shortcuts import get_perms

from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest
from igdectk.module.manager import module_manager
from main.cursor import CursorQuery
from main.models import Entity, Profile

from .filters import GroupFilter, UserFilter
from .utils import get_permissions_for, prefetch_permissions_for


class RestPermission(RestHandler):
    regex = r'^permission/$'
    name = 'permission'


class RestPermissionType(RestPermission):
    regex = r'^type/$'
    suffix = 'type'


class RestPermissionUser(RestPermission):
    regex = r'^user/$'
    suffix = 'user'


class RestPermissionUserCount(RestPermissionUser):
    regex = r'^user/count/$'
    suffix = 'user/count/'


class RestPermissionUserSearch(RestPermissionUser):
    regex = r'^search/$'
    suffix = 'search'


class RestPermissionUserName(RestPermissionUser):
    regex = r'^username/(?P<username>[a-zA-Z0-9\.\-_]+)/$'
    suffix = 'username'


class RestPermissionUserNamePermission(RestPermissionUserName):
    regex = r'^permission/$'
    suffix = 'permission'


class RestPermissionGroup(RestPermission):
    regex = r'^group/$'
    suffix = 'group'


class RestPermissionGroupCount(RestPermission):
    regex = r'^count/$'
    suffix = 'count'


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
    regex = r'^username/(?P<username>[a-zA-Z0-9\.\-_]+)/$'
    suffix = 'username'


class RestPermissionGroupIdPermission(RestPermissionGroupId):
    regex = r'^permission/$'
    suffix = 'permission'


class RestPermissionGroupIdPermissionCount(RestPermissionGroupIdPermission):
    regex = r'^permission/count/$'
    suffix = 'count'


class RestPermissionPermission(RestPermission):
    regex = r'^permission/$'
    name = 'permission'


class RestPermissionPermissionEntity(RestPermission):
    regex = r'^(?P<content_type>[a-z\_]+)/(?P<ent_id>[0-9]+)/$'
    name = 'entity'


# Group name validator
GROUP_NAME_VALIDATOR = {"type": "string", "minLength": 3, "maxLength": 80, "pattern": "^[a-zA-Z0-9\-\_]+$"}

# Group name validator optional
GROUP_NAME_VALIDATOR_OPTIONAL = {"type": "string", "minLength": 3, "maxLength": 80, "pattern": "^[a-zA-Z0-9\-\_]+$",
                                 "required": False}


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
    cursor = json.loads(request.GET.get('cursor', 'null'))
    limit = results_per_page
    sort_by = json.loads(request.GET.get('sort_by', '["username"]'))
    order_by = sort_by

    cq = CursorQuery(User)

    if request.GET.get('search'):
        search = json.loads(request.GET['search'])
        cq.filter(search)

    if request.GET.get('filters'):
        filters = json.loads(request.GET['filters'])
        cq.filter(filters)

    cq.cursor(cursor, order_by)
    cq.order_by(order_by).limit(limit)
    cq.set_count('user_permissions')

    user_items = []

    for user in cq:
        user_items.append({
            'id': user.id,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
            'is_active': user.is_active,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
            'num_permissions': user.user_permissions.all().count()  # optimized by the set_count
        })

    results = {
        'perms': get_permissions_for(request.user, "auth", "user"),
        'items': user_items,
        'prev': cq.prev_cursor,
        'cursor': cursor,
        'next': cq.next_cursor
    }

    return HttpResponseRest(request, results)


@RestPermissionUserCount.def_auth_request(Method.GET, Format.JSON, staff=True)
def get_users_list_count(request):
    cq = CursorQuery(User)

    if request.GET.get('search'):
        search = json.loads(request.GET['search'])
        cq.filter(search)

    if request.GET.get('filters'):
        filters = json.loads(request.GET['filters'])
        cq.filter(filters)

    results = {
        'perms': [],
        'count': cq.count()
    }

    return HttpResponseRest(request, results)


@RestPermissionGroup.def_auth_request(Method.GET, Format.JSON, staff=True)
def get_groups_list(request):
    results_per_page = int_arg(request.GET.get('more', 30))
    cursor = json.loads(request.GET.get('cursor', 'null'))
    limit = results_per_page
    sort_by = json.loads(request.GET.get('sort_by', '["name"]'))
    order_by = sort_by

    cq = CursorQuery(Group)

    if request.GET.get('search'):
        search = json.loads(request.GET['search'])
        cq.filter(search)

    if request.GET.get('filters'):
        filters = json.loads(request.GET['filters'])
        cq.filter(filters)

    cq.cursor(cursor, order_by)
    cq.order_by(order_by).limit(limit)
    cq.prefetch_related('permissions')
    cq.prefetch_related('user_set')

    # @todo is it prefetch something ?
    prefetch_permissions_for(request.user, cq)

    group_items = []

    for group in cq:
        group_items.append({
            'id': group.id,
            'name': group.name,
            'num_users': group.user_set.all().count(),  # optimized by prefetch_related
            'num_permissions': group.permissions.all().count(),  # optimized by prefetch_related
            'perms': get_permissions_for(request.user, "auth", "group", group),
        })

    results = {
        'perms': get_permissions_for(request.user, "auth", "group"),
        'items': group_items,
        'prev': cq.prev_cursor,
        'cursor': cursor,
        'next': cq.next_cursor
    }

    return HttpResponseRest(request, results)


@RestPermissionGroupCount.def_auth_request(Method.GET, Format.JSON, staff=True)
def get_groups_list_count(request):
    cq = CursorQuery(Group)

    if request.GET.get('search'):
        search = json.loads(request.GET['search'])
        cq.filter(search)

    if request.GET.get('filters'):
        filters = json.loads(request.GET['filters'])
        cq.filter(filters)

    results = {
        'perms': [],
        'count': cq.count()
    }

    return HttpResponseRest(request, results)


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
            "name": GROUP_NAME_VALIDATOR_OPTIONAL
        },
    },
    staff=True)
def patch_group(request, grp_id):
    group = get_object_or_404(Group, id=int(grp_id))
    group_name = request.data.get('name')

    update = False
    result = {'id': group.pk, 'perms': get_permissions_for(request.user, "auth", "group")}

    if group_name and group_name != group.name:
        if Group.objects.filter(name__exact=group_name).exists():
            raise SuspiciousOperation(_("Group name already in usage"))

        group.name = group_name
        group.full_clean()
        result['name'] = group.name

        update = True

    if update:
        group.save()

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

    # from classification.models import Taxon
    # content_type = ContentType.objects.get_by_natural_key('classification', 'Taxon')
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


@RestPermissionUserName.def_admin_request(Method.GET, Format.JSON)
def get_user_info(request, username):
    user = get_object_or_404(User, username=username)

    result = {
        'id': user.pk,
        'username': user.username,
        'first_name': user.first_name,
        'last_name': user.last_name
    }

    return HttpResponseRest(request, result)


@RestPermissionUserName.def_admin_request(Method.PATCH, Format.JSON, content={
    "type": "object",
    "properties": {
        "is_active": {"type": "boolean", "required": False},
        "is_staff": {"type": "boolean", "required": False},
        "is_superuser": {"type": "boolean", "required": False},
    },
})
@transaction.atomic
def patch_user(request, username):
    user = get_object_or_404(User, username=username)
    update = False

    result = {'id': user.pk}

    if 'is_active' in request.data:
        update = True
        user.is_active = request.data['is_active']
        result['is_active'] = user.is_active

        # update the pending state if necessary
        try:
            profile = Profile.objects.get(user=user)
            if user.is_active and profile.pending:
                profile.pending = False
                profile.save()
        except Profile.DoesNotExist:
            pass

    if 'is_staff' in request.data:
        update = True
        user.is_staff = request.data['is_staff']
        result['is_staff'] = user.is_staff

    if 'is_superuser' in request.data:
        update = True
        user.is_superuser = request.data['is_superuser']
        result['is_superuser'] = user.is_superuser

    if update:
        user.save()

    return HttpResponseRest(request, result)


@RestPermissionUserNamePermission.def_auth_request(
    Method.POST, Format.JSON, content={
        "type": "object",
        "properties": {
            "permission": Entity.PERMISSION_VALIDATOR,
            "content_type": Entity.CONTENT_TYPE_VALIDATOR,
            "object": {"type": "integer", 'required': False},
        },
    },
    perms={'auth.change_user': _("You are not allowed to changer a user")},
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
    perms={'auth.change_user': _("You are not allowed to changer a user")},
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


@RestPermissionGroupIdPermission.def_auth_request(Method.GET, Format.JSON, staff=True)
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


@RestPermissionGroupIdPermission.def_auth_request(
    Method.POST, Format.JSON, content={
        "type": "object",
        "properties": {
            "permission": Entity.PERMISSION_VALIDATOR,
            "content_type": Entity.CONTENT_TYPE_VALIDATOR,
            "object": {"type": "integer", 'required': False},
        },
    },
    perms={'auth.change_group': _("You are not allowed to change a group")},
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


@RestPermissionGroupIdPermission.def_auth_request(
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
    perms={'auth.change_group': _("You are not allowed to change a group")},
    staff=True)
def change_group_permission(request, grp_id):
    action = request.data['action']
    permission = request.data['permission']
    content_type = request.data['content_type']
    target = request.data['target']
    object_id = int(request.data['object']) if 'object' in request.data else None

    if content_type == "auth.permission" and not request.user.is_superuser:
        raise PermissionDenied(_("Only a superuser can change an auth.permission"))

    group = get_object_or_404(Group, id=int(grp_id))

    app_label, model = content_type.split('.')
    content_type = ContentType.objects.get_by_natural_key(app_label, model)

    if target == "permission":
        if not object_id:
            perm = get_object_or_404(Permission, codename=permission, content_type=content_type)
            if action == "add":
                group.permissions.add(perm)
            elif action == "remove":
                group.permissions.remove(perm)
            else:
                raise SuspiciousOperation('Invalid action')
        else:
            obj = get_object_or_404(content_type.model, id=object_id)

            if action == "add":
                GroupObjectPermission.objects.assign_perm(permission, group=group, obj=obj)
            elif action == "remove":
                GroupObjectPermission.objects.remove_perm(permission, group=group, obj=obj)
            else:
                raise SuspiciousOperation('Invalid action')

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
    cursor = json.loads(request.GET.get('cursor', 'null'))
    limit = results_per_page
    sort_by = json.loads(request.GET.get('sort_by', '["username"]'))
    order_by = sort_by

    group = get_object_or_404(Group, id=int(grp_id))
    cq = CursorQuery(User)

    if request.GET.get('search'):
        search = json.loads(request.GET['search'])
        cq.filter(search)

    if request.GET.get('filters'):
        filters = json.loads(request.GET['filters'])
        cq.filter(filters)

    cq.inner_join(Group, related_name='user_set', group=group.pk)
    cq.cursor(cursor, order_by)
    cq.order_by(order_by).limit(limit)

    user_items = []

    for user in cq:
        user_items.append({
            'id': user.id,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
            'is_active': user.is_active,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
        })

    results = {
        'perms': get_permissions_for(request.user, "auth", "group", group),
        'items': user_items,
        'prev': cq.prev_cursor,
        'cursor': cursor,
        'next': cq.next_cursor
    }

    return HttpResponseRest(request, results)


@RestPermissionPermission.def_auth_request(Method.GET, Format.JSON)
def get_self_permissions(request):
    """
    User get its own permissions for its session.
    """
    user = get_object_or_404(User, username=request.user.username)

    permissions = []

    # at user level and groups
    checkout = Permission.objects.filter(
        Q(user=user) | Q(group__in=user.groups.all().values_list('id'))).select_related('content_type')

    for perm in checkout:
        permissions.append({
            'id': perm.codename,
            'name': perm.name,
            'app_label': perm.content_type.app_label,
        })

    return HttpResponseRest(request, permissions)


@RestPermissionPermissionEntity.def_auth_request(Method.GET, Format.JSON)
def get_self_permissions_for_entity(request, content_type, ent_id):
    """
    User get its own permissions for its session for a specific entity
    """
    user = get_object_or_404(User, username=request.user.username)

    permissions = []

    app_label, model = content_type.split('.')
    content_type = ContentType.objects.get_by_natural_key(app_label, model)

    entity = get_object_or_404(content_type.model_class(), int(ent_id))

    perms = get_perms(user, entity)
    permission_details = Permission.objects.find(codename__in=perms)

    lookup = {}

    for perm in permission_details:
        lookup[perm.codename] = perm.name

    for perm in perms:
        perm_detail = lookup.get(perm)

        if perm_detail:
            permissions.append({
                'id': perm,
                'name': perm_detail,
                'app_label': app_label
            })

    return HttpResponseRest(request, permissions)
