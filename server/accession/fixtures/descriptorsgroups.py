# -*- coding: utf-8 -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
Setup the groups of descriptors.
"""

GROUPS = {
    'common': {
        'id': None,
        'name': 'common',
        'can_delete': False,
        'can_modify': False,
    },
    'accession': {
        'id': None,
        'name': 'accession',
        'can_delete': False,
        'can_modify': False,
    },
    'MCPD': {
        'id': None,
        'name': 'MCPD',
        'can_delete': False,
        'can_modify': False,
    }
}


def fixture(fixture_manager):
    fixture_manager.create_or_update_groups(GROUPS)
