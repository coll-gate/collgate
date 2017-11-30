# -*- coding: utf-8; -*-
#
# @file descriptorstypes.py
# @brief Setup the types of descriptors.
# @author Medhi BOULNEMOUR (INRA UMR1095)
# @date 2017-01-03
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

DESCRIPTORS = {
    'country': {
        'id': None,
        'name': 'country',
        'code': 'GE_002',
        'group': 'common',
        'can_delete': False,
        'can_modify': False,
        'description': 'Defines a country location.',
        'format': {
            'type': 'country'
        }
    },
    'city': {
        'id': None,
        'name': 'city',
        'code': 'GE_003',
        'group': 'common',
        'can_delete': False,
        'can_modify': False,
        'description': 'Defines a city location.',
        'format': {
            'type': 'city'
        }
    }
}


def fixture(fixture_manager, factory_manager):
    fixture_manager.create_or_update_types(DESCRIPTORS)
