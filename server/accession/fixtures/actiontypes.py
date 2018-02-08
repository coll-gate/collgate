# -*- coding: utf-8; -*-
#
# @file actiontypes.py
# @brief collgate
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2017-11-30
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details

ACTION_TYPES = {
    'introduction': {
        'id': None,
        'name': 'introduction',
        'label': {
            'en': 'Introduction',
            'fr': 'Introduction'
        },
        'format': {'steps': []}
    },
    'multiplication': {
        'id': None,
        'name': 'multiplication',
        'label': {
            'en': 'Multiplication',
            'fr': 'Multiplication'
        },
        'format': {'steps': []}
    },
    'regeneration': {
        'id': None,
        'name': 'regeneration',
        'label': {
            'en': 'Regeneration',
            'fr': 'Regeneration'
        },
        'format': {'steps': []}
    },
    'test': {
        'id': None,
        'name': 'conformity_test',
        'label': {
            'en': 'Conformity test',
            'fr': 'Test de conformité'
        },
        'format': {'steps': []}
    },
    'cleanup': {
        'id': None,
        'name': 'cleanup',
        'label': {
            'en': 'Nettoyage',
            'fr': 'Clean-up'
        },
        'format': {'steps': []}
    },
    'sample': {
        'id': None,
        'name': 'sample',
        'label': {
            'en': 'Sample',
            'fr': 'Echantillon'
        },
        'format': {'steps': []}
    },
    'dispatch': {
        'id': None,
        'name': 'dispatch',
        'label': {
            'en': 'Dispatch',
            'fr': 'Dispatch'
        },
        'format': {'steps': []}
    },
    'elimination': {
        'id': None,
        'name': 'elimination',
        'label': {
            'en': 'Elimination',
            'fr': 'Elimination'
        },
        'format': {'steps': []}
    },
    'complement': {
        'id': None,
        'name': 'complement',
        'label': {
            'en': 'Complement',
            'fr': 'Complément'
        },
        'format': {'steps': []}
    },
    'characterization': {
        'id': None,
        'name': 'characterization',
        'label': {
            'en': 'Characterization',
            'fr': 'Caractérisation'
        },
        'format': {'steps': []}
    },
}


def fixture(fixture_manager, factory_manager):
    from accession.api.actiontype import ActionTypeFactory

    factory = ActionTypeFactory()
    factory_manager.register(factory)

    factory.create_or_update(factory_manager, ACTION_TYPES, False)
