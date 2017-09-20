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
    'accession_code': {
        'id': None,
        'name': 'accession_code',
        'unique': True,
        'has_language': False,
        'label': {
            'en': 'GRC code',
            'fr': 'Code CRB'
        },
        'can_delete': False,
        'can_modify': True
    },
    'accession_name': {
        'id': None,
        'name': 'accession_name',
        'unique': True,
        'has_language': True,
        'label': {
            'en': 'Primary name',
            'fr': 'Nom principal'
        },
        'can_delete': False,
        'can_modify': True
    },
    'accession_geves_code': {
        'id': None,
        'name': 'accession_geves_code',
        'unique': True,
        'has_language': False,
        'label': {
            'en': 'GEVES code',
            'fr': 'Code GEVES'
        },
        'can_delete': False,
        'can_modify': True
    },
    'accession_alternate_name': {
        'id': None,
        'name': 'accession_alternate_name',
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
    fixture_manager.create_or_update_synonym_types('accession', 'accession', SYNONYM_TYPES)
