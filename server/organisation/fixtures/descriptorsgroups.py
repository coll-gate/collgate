# -*- coding: utf-8 -*-
#
# Copyright (c) 2017 INRA UMR1095 GDEC

"""
Setup the groups of organisation.
"""

GROUPS = {
    'organisation': {
        'id': None,
        'name': 'organisation',
        'can_delete': False,
        'can_modify': False,
    },
}


def fixture(fixture_manager):
    fixture_manager.create_or_update_groups(GROUPS)
