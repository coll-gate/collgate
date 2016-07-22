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
        'description': 'List of countries codes',
        'format': {'type': 'tuple', 'fields': ['name', 'iso']}
    },
    'accession_synonym_types': {
        'id': None,
        'name': 'accession_synonym_types',
        'code': 'ID_001',
        'group': 'general',
        'description': 'List of types of synonyms for an accession',
        'format': {'type': 'string'}
    }
}


def fixture():
    sys.stdout.write(" + Create descriptors types...\n")

    for descriptor_name, descriptor_data in DESCRIPTORS.items():
        sys.stdout.write(" + Descriptor %s\n" % descriptor_name)

        descriptor, created = DescriptorType.objects.get_or_create(name=descriptor_name, defaults={
            'code': descriptor_data.get('code', ''),
            'description': descriptor_data.get('description', ''),
            'group_id': GROUPS.get(descriptor_data.get('group', 'general')),
            'format': json.dumps(descriptor_data.get('format', {'type': 'string'})),
        })

        # keep id for others fixtures
        descriptor_data['id'] = descriptor.id
