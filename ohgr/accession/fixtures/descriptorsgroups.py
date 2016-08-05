# -*- coding: utf-8 -*-

"""
Setup the groups of descriptors.
"""

import sys

from ..models import DescriptorGroup

GROUPS = {
    'general': {
        'id': None,
        'name': 'general',
        'can_delete': False,
        'can_modify': False,
    },
}


def fixture():
    sys.stdout.write(" + Create descriptors types groups...\n")

    for k, v in GROUPS.items():
        group_name = v['name']

        group, created = DescriptorGroup.objects.get_or_create(
            name=group_name,
            can_delete=v.get('can_delete', False),
            can_modify=v.get('can_modify', False)
        )

        # keep id for others fixtures
        GROUPS[group_name]['id'] = group.id
