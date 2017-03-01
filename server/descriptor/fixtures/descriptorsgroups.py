# -*- coding: utf-8 -*-

"""
Setup the groups of descriptors.
"""

import sys

from descriptor.models import DescriptorGroup

GROUPS = {
    'organisation': {
        'id': None,
        'name': 'common',
        'can_delete': False,
        'can_modify': False
    },
}


def fixture():
    sys.stdout.write(" + Create descriptor types groups...\n")

    for k, v in GROUPS.items():
        group_name = v['name']

        group, created = DescriptorGroup.objects.update_or_create(name=group_name, defaults={
            'can_delete': v.get('can_delete', False),
            'can_modify': v.get('can_modify', False)
        })

        # keep id for others fixtures
        GROUPS[group_name]['id'] = group.id
