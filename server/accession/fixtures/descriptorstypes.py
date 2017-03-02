# -*- coding: utf-8 -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
Setup the types of descriptors.
"""

DESCRIPTORS = {
    'accession_synonym_types': {
        'id': None,
        'name': 'accession_synonym_types',
        'code': 'AC_001',
        'group': 'accession',
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
    'country': {  # @todo remove me
        'id': None,
        'name': 'country',
        'code': 'CO_705',
        'group': 'common',
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
    'city': {  # @todo remove me
        'id': None,
        'name': 'city',
        'code': 'IN_003',
        'group': 'common',
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


def fixture(fixture_manager):
    fixture_manager.create_or_update_types(DESCRIPTORS)
