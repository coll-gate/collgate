# -*- coding: utf-8 -*-

"""
Setup the groups of descriptors.
"""

import sys

from ..models import DescriptorGroup

GROUPS = {
    'general': None,
}


def fixture():
    sys.stdout.write(" + Create descriptors types groups...\n")

    for group_name in GROUPS:
        group, created = DescriptorGroup.objects.get_or_create(name=group_name)

        # keep id for others fixtures
        GROUPS[group_name] = group.id
