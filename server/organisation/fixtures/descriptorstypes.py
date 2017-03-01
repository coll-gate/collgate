# -*- coding: utf-8 -*-
#
# Copyright (c) 2017 INRA UMR1095 GDEC

"""
Setup the types of descriptors.
"""

import json
import sys

from descriptor.models import DescriptorType
from .descriptorsgroups import GROUPS

DESCRIPTORS = {
    'organisations_types': {
        'id': None,
        'name': 'organisations_types',
        'code': 'OR_001',
        'group': 'organisation',
        'can_delete': False,
        'can_modify': True,
        'description': 'List of types of organisations for an organisation',
        'format': {
            'type': 'enum_single',
            'format': 'category',
            'trans': True,
            'list_type': 'dropdown',
            'display_fields': 'value0',
            'sortby_field': 'value0'
        }
    }
}


def fixture():
    sys.stdout.write(" + Create descriptors types...\n")

    for descriptor_name, descriptor_data in DESCRIPTORS.items():
        sys.stdout.write(" + Descriptor %s\n" % descriptor_name)

        type_format = descriptor_data.get('format', {})

        descriptor, created = DescriptorType.objects.update_or_create(name=descriptor_name, defaults={
            'code': descriptor_data.get('code', ''),
            'description': descriptor_data.get('description', ''),
            'group_id': GROUPS.get(descriptor_data.get('group', 'organisation'))['id'],
            'format': json.dumps(type_format),
            'can_delete': descriptor_data.get('can_delete', False),
            'can_modify': descriptor_data.get('can_modify', False)
        })

        # keep id for others fixtures
        descriptor_data['id'] = descriptor.id
