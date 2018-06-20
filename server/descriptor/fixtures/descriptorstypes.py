# -*- coding: utf-8; -*-
#
# @file descriptorstypes.py
# @brief Setup the types of descriptors.
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2017-01-03
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

DESCRIPTORS = {
    'acronym_1': {
        'id': None,
        'name': 'acronym_1',
        'code': 'DE_001',
        'group_name': 'common',
        'label': {'en': 'Acronym', 'fr': 'Acronyme'},
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
        'group_name': 'common',
        'label': {'en': 'Code', 'fr': 'Code'},
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
        'group_name': 'common',
        'label': {'en': 'Address', 'fr': 'Adresse'},
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
        'group_name': 'common',
        'label': {'en': 'Zip code', 'fr': 'Code postal'},
        'can_delete': False,
        'can_modify': False,
        'description': 'Defines a ZIP code string with a maximum of 16 characters.',
        'format': {
            'type': 'string',
            'regexp': '^[0-9]{0,16}$'
        }
    },
    'comment': {
        'id': None,
        'name': 'comment',
        'code': 'DE_005',
        'group_name': 'common',
        'label': {'en': 'Comment', 'fr': 'Commentaire'},
        'can_delete': False,
        'can_modify': False,
        'description': 'Defines a simple comment string.',
        'format': {
            'type': 'string'
        }
    },
}


def fixture(fixture_manager, factory_manager):
    fixture_manager.create_or_update_descriptors(DESCRIPTORS)
