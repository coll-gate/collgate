# -*- coding: utf-8; -*-
#
# @file descriptorstypes.py
# @brief 
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2017-01-03
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

"""
Setup the types of descriptors.
"""

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
            'regexp': '^.{0,32}$'
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
            'regexp': '^.{0,16}$'
        }
    },
    'address': {
        'id': None,
        'name': 'address',
        'code': 'DE_003',
        'group': 'common',
        'can_delete': False,
        'can_modify': False,
        'description': 'Defines an address string with a maximum of 512 characters.',
        'format': {
            'type': 'string',
            'regexp': '^.{0,512}$'
        }
    },
    'zipcode': {
        'id': None,
        'name': 'zipcode',
        'code': 'DE_004',
        'group': 'common',
        'can_delete': False,
        'can_modify': False,
        'description': 'Defines a ZIP code string with a maximum of 16 characters.',
        'format': {
            'type': 'string',
            'regexp': '^[0-9]{0,16}$'
        }
    }
}


def fixture(fixture_manager):
    fixture_manager.create_or_update_types(DESCRIPTORS)

