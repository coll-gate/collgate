# -*- coding: utf-8 -*-

"""
Setup the types of descriptors.
"""
import json
import sys

from descriptor.models import DescriptorType
from .descriptorsgroups import GROUPS

DESCRIPTORS = {
    'accession_synonym_types': {
        'id': None,
        'name': 'accession_synonym_types',
        'code': 'IN_001',
        'group': 'general',
        'can_delete': False,
        'can_modify': False,
        'description': 'List of types of synonyms for an accession',
        'format': {
            'type': 'enum_single',
            'format': 'category',
            'fields': ['name'],
            'trans': True,
            'list_type': 'dropdown',
            'display_fields': 'value0',
            'sortby_field': 'value0'
        }
    },
    'country': {
        'id': None,
        'name': 'country',
        'code': 'CO_705',
        'group': 'general',
        'can_delete': False,
        'can_modify': False,
        'description': 'List of countries with code',
        'format': {
            'type': 'enum_pair',
            'format': 'category',
            'fields': ['name', 'iso'],
            'trans': True,
            'list_type': 'dropdown',
            'display_fields': 'value0',
            'sortby_field': 'value0'
        },
        'lookup': {}
    },
    'city': {
        'id': None,
        'name': 'city',
        'code': 'IN_003',
        'group': 'general',
        'can_delete': False,
        'can_modify': False,
        'description': 'List of cities with location',
        'format': {
            'type': 'enum_pair',
            'format': 'category',
            'fields': ['name', 'coord'],
            'trans': True,
            'list_type': 'autocomplete',
            'display_fields': 'value0',
            'sortby_field': 'value0'
        }
    },
}


def fixture():
    sys.stdout.write(" + Create descriptors types...\n")

    for descriptor_name, descriptor_data in DESCRIPTORS.items():
        sys.stdout.write(" + Descriptor %s\n" % descriptor_name)

        type_format = descriptor_data.get('format', {})

        descriptor, created = DescriptorType.objects.update_or_create(name=descriptor_name, defaults={
            'code': descriptor_data.get('code', ''),
            'description': descriptor_data.get('description', ''),
            'group_id': GROUPS.get(descriptor_data.get('group', 'general'))['id'],
            'format': json.dumps(type_format),
            'can_delete': descriptor_data.get('can_delete', False),
            'can_modify': descriptor_data.get('can_modify', False)
        })

        # keep id for others fixtures
        descriptor_data['id'] = descriptor.id
