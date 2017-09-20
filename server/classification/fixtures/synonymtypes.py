# -*- coding: utf-8; -*-
#
# @file synonymtypes.py
# @brief Setup the type of synonyms.
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2017-09-18
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details

SYNONYM_TYPES = {
    'classification_entry_code': {
        'id': None,
        'name': 'classification_entry_code',
        'unique': True,
        'has_language': False,
        'label': {
            'en': 'GRC code',
            'fr': 'Code CRB'
        },
        'can_delete': False,
        'can_modify': True
    },
    'classification_entry_name': {
        'id': None,
        'name': 'classification_entry_name',
        'unique': True,
        'has_language': True,
        'label': {
            'en': 'Primary name',
            'fr': 'Nom principal'
        },
        'can_delete': False,
        'can_modify': True
    },
    'classification_entry_alternate_name': {
        'id': None,
        'name': 'classification_entry_alternate_name',
        'unique': False,
        'has_language': True,
        'label': {
            'en': 'Alternate name',
            'fr': 'Nom alternatif'
        },
        'can_delete': False,
        'can_modify': True
    }
}


def fixture(fixture_manager):
    fixture_manager.create_or_update_synonym_types('classification', 'classificationentry', SYNONYM_TYPES)
