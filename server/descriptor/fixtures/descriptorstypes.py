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
    'acronym_1': {
        'id': None,
        'name': 'acronym_1',
        'code': 'DE_001',
        'group': 'common',
        'can_delete': False,
        'can_modify': False,
        'description': 'Defines a simple acronym string with a maximum of 32 characters.',
        'format': {
            'type': 'string',
            'regexp': '^.{1,32}$'
        }
    },
    'code_16': {
        'id': None,
        'name': 'code_16',
        'code': 'DE_002',
        'group': 'common',
        'can_delete': False,
        'can_modify': False,
        'description': 'Defines a simple code string with a maximum of 16 characters.',
        'format': {
            'type': 'string',
            'regexp': '^.{1,16}$'
        }
    },
    'address': {
        'id': None,
        'name': 'address',
        'code': 'DE_003',
        'group': 'common',
        'can_delete': False,
        'can_modify': False,
        'description': 'Defines an address string with a maximum of 1024 characters.',
        'format': {
            'type': 'string',
            'regexp': '^.{0,1024}$'
        }
    },
    'zipcode': {
        'id': None,
        'name': 'address',
        'code': 'DE_004',
        'group': 'common',
        'can_delete': False,
        'can_modify': False,
        'description': 'Defines a ZIP code string with a maximum of 16 characters.',
        'format': {
            'type': 'string',
            'regexp': '^.[0-9]{1,16}$'
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
