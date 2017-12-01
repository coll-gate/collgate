# -*- coding: utf-8; -*-
#
# @file descriptorsgroups.py
# @brief Setup the groups of organisation.
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2017-01-03
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

GROUPS = {
    'organisation': {
        'id': None,
        'name': 'organisation',
        'can_delete': False,
        'can_modify': False,
    },
}


def fixture(fixture_manager, factory_manager):
    fixture_manager.create_or_update_groups(GROUPS)
