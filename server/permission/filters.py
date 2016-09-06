# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
coll-gate permission REST API
"""
import operator

from django.contrib.auth.models import Permission, User, Group
from django.contrib.contenttypes.models import ContentType
from functools import reduce

from django.core.exceptions import SuspiciousOperation
from django.db.models import Q
from guardian.models import UserObjectPermission, GroupObjectPermission


class GroupFilter:
    @classmethod
    def name_partial(cls, filters):
        if 'name' not in filters:
            raise SuspiciousOperation("Missing name filter")

        name = filters['name']

        if not name:
            return Group.objects.none()

        if isinstance(name, str):
            query = Group.objects.filter(name__icontains=name)
        elif isinstance(name, list):
            query = reduce(operator.or_, (Group.objects.filter(Q(name__icontains=term)) for term in name))
        else:
            raise SuspiciousOperation("Unsupported name type")

        return query

    @classmethod
    def name_exact(cls, filters):
        if 'name' not in filters:
            raise SuspiciousOperation("Missing name filter")

        name = filters['name']

        if not name:
            return Group.objects.none()

        if isinstance(name, str):
            query = Group.objects.filter(name__iexact=name)
        else:
            raise SuspiciousOperation("Unsupported name type")

        return query

    @classmethod
    def search(cls, filters):
        method = filters.get('method')
        if method:
            if method == 'icontains':
                return cls.name_partial(filters)
            elif method == 'ieq':
                return cls.name_exact(filters)

        raise SuspiciousOperation("Unsupported search method")


class UserFilter:
    @classmethod
    def username_partial(cls, filters):
        if 'username' not in filters:
            raise SuspiciousOperation("Missing username filter")

        username = filters['username']

        if not username:
            return User.objects.none()

        if isinstance(username, str):
            query = User.objects.filter(username__icontains=username)
        elif isinstance(username, list):
            query = reduce(operator.or_, (User.objects.filter(Q(username__icontains=term)) for term in username))
        else:
            raise SuspiciousOperation("Unsupported username type")

        return query

    @classmethod
    def username_exact(cls, filters):
        if 'username' not in filters:
            raise SuspiciousOperation("Missing username filter")

        username = filters['username']

        if not username:
            return User.objects.none()

        if isinstance(username, str):
            query = User.objects.filter(username__iexact=username)
        else:
            raise SuspiciousOperation("Unsupported username type")

        return query

    @classmethod
    def any_name_partial(cls, filters):
        if '*' not in filters:
            raise SuspiciousOperation("Missing * filter")

        any = filters['*']

        if not any:
            return User.objects.none()

        if isinstance(any, str):
            query = User.objects.filter(Q(username__icontains=any) |
                                        Q(first_name__icontains=any) |
                                        Q(last_name__icontains=any))
        elif isinstance(any, list):
            query = reduce(operator.or_, (User.objects.filter(
                Q(username__icontains=term) | Q(first_name__icontains=term) | Q(last_name__icontains=term)) for term in any))
        else:
            raise SuspiciousOperation("Unsupported * type")

        return query

    @classmethod
    def any_name_exact(cls, filters):
        if '*' not in filters:
            raise SuspiciousOperation("Missing * filter")

        any = filters['*']

        if not any:
            return User.objects.none()

        if isinstance(any, str):
            query = User.objects.filter(Q(username__iexact=any) |
                                        Q(first_name__iexact=any) |
                                        Q(last_name__iexact=any))
        elif isinstance(any, list):
            query = reduce(operator.or_, (User.objects.filter(
                Q(username__iexact=term) | Q(first_name__iexact=term) | Q(last_name__iexact=term)) for term in any))
        else:
            raise SuspiciousOperation("Unsupported * type")

        return query

    @classmethod
    def search(cls, filters):
        method = filters.get('method')
        fields = filters.get('fields')

        if method and fields:
            if method == 'icontains':
                if fields == 'username':
                    return cls.username_partial(filters)
                elif fields == '*':
                    return cls.any_name_partial(filters)
            elif method == 'ieq':
                if fields == 'username':
                    return cls.username_exact(filters)
                elif fields == '*':
                    return cls.any_name_exact(filters)

        raise SuspiciousOperation("Unsupported search method")
