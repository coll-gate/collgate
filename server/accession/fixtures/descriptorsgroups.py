# -*- coding: utf-8; -*-
#
# @file descriptorsgroups.py
# @brief Setup the groups of descriptors.
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2016-09-01
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

GROUPS = {
    'common': {
        'id': None,
        'name': 'common',
        'can_delete': False,
        'can_modify': False,
    },
    'MCPD': {
        'id': None,
        'name': 'MCPD',
        'can_delete': False,
        'can_modify': False,
    },
    'BATCH': {
        'id': None,
        'name': 'BATCH',
        'can_delete': False,
        'can_modify': False,
    }
}


def fixture(fixture_manager, factory_manager):
    fixture_manager.create_or_update_groups(GROUPS)
