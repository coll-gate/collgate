# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
ohgr permission utilities
"""


def get_permissions_for(user_or_group, app_label, model, obj=None):
    # _p = Permission.objects.filter(content_type__app_label=app_label, content_type__model=model)
    # perms = UserObjectPermission.objects.filter(user=user, permission__in=_p)
    perms = user_or_group.get_all_permissions()

    results = []

    for perm in perms:
        p = perm.split('_')
        if perm.startswith(app_label) and (len(p) > 0) and (p[1] == model):
            results.append(perm)

    if obj:
        perms = user_or_group.get_all_permissions(obj=obj)

        for perm in perms:
            p = perm.split('_')
            if perm.startswith(app_label) and (len(p) > 0) and (p[1] == model):
                if (len(p) == 2) and p[2] == 'true':
                    results.append(perm)
                else:
                    results.append(perm)

    return results
