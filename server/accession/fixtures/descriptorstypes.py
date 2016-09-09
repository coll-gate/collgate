# -*- coding: utf-8 -*-

"""
Setup the types of descriptors.
"""
import json
import sys

from ..models import DescriptorGroup, DescriptorType
from .descriptorsgroups import GROUPS

DESCRIPTORS = {
    'country': {
        'id': None,
        'name': 'country',
        'code': 'CO_705',
        'group': 'general',
        'can_delete': False,
        'can_modify': False,
        'description': 'List of countries codes',
        'format': {
            'type': 'enum_pair',
            'format': 'category',
            'fields': ['name', 'iso'],
            'trans': True
        }
    },
    'accession_synonym_types': {
        'id': None,
        'name': 'accession_synonym_types',
        'code': 'ID_001',
        'group': 'general',
        'can_delete': False,
        'can_modify': False,
        'description': 'List of types of synonyms for an accession',
        'format': {
            'type': 'enum_single',
            'format': 'category',
            'trans': True
        }
    }
}


def fixture():
    sys.stdout.write(" + Create descriptors types...\n")

    for descriptor_name, descriptor_data in DESCRIPTORS.items():
        sys.stdout.write(" + Descriptor %s\n" % descriptor_name)

        src_format = descriptor_data.get('format', {})

        format = {
            'type': src_format.get('type', 'string'),
            'format': src_format.get('format', 'category'),
            'unit': src_format.get('unit', 'custom'),
            'precision': src_format.get('precision', '0.0'),
            'fields': src_format.get('fields', []),
            'trans': src_format.get('trans', False)
        }

        descriptor, created = DescriptorType.objects.get_or_create(name=descriptor_name, defaults={
            'code': descriptor_data.get('code', ''),
            'description': descriptor_data.get('description', ''),
            'group_id': GROUPS.get(descriptor_data.get('group', 'general'))['id'],
            'format': json.dumps(format),
            'can_delete': descriptor_data.get('can_delete', False),
            'can_modify': descriptor_data.get('can_modify', False)
        })

        # keep id for others fixtures
        descriptor_data['id'] = descriptor.id