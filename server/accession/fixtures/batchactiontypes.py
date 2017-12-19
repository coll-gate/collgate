# -*- coding: utf-8; -*-
#
# @file batchactiontypes.py
# @brief collgate
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2017-11-30
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details

BATCH_ACTION_TYPES = {
    'introduction': {
        'id': None,
        'name': 'introduction',
        'label': {
            'en': 'Introduction',
            'fr': 'Introduction'
        },
        'format': {'type': 'creation'}
    },
    'multiplication': {
        'id': None,
        'name': 'multiplication',
        'label': {
            'en': 'Multiplication',
            'fr': 'Multiplication'
        },
        'format': {'type': 'multiplication'}
    },
    'regeneration': {
        'id': None,
        'name': 'regeneration',
        'label': {
            'en': 'Regeneration',
            'fr': 'Regeneration'
        },
        'format': {'type': 'regeneration'}
    },
    'test': {
        'id': None,
        'name': 'conformity_test',
        'label': {
            'en': 'Conformity test',
            'fr': 'Test de conformité'
        },
        'format': {'type': 'conformity_test'}
    },
    'cleanup': {
        'id': None,
        'name': 'cleanup',
        'label': {
            'en': 'Nettoyage',
            'fr': 'Clean-up'
        },
        'format': {'type': 'sanitation'}
    },
    'sample': {
        'id': None,
        'name': 'sample',
        'label': {
            'en': 'Sample',
            'fr': 'Echantillon'
        },
        'format': {'type': 'sample'}
    },
    'dispatch': {
        'id': None,
        'name': 'dispatch',
        'label': {
            'en': 'Dispatch',
            'fr': 'Dispatch'
        },
        'format': {'type': 'dispatch'}
    },
    'elimination': {
        'id': None,
        'name': 'elimination',
        'label': {
            'en': 'Elimination',
            'fr': 'Elimination'
        },
        'format': {'type': 'elimination'}
    },
    'complement': {
        'id': None,
        'name': 'complement',
        'label': {
            'en': 'Complement',
            'fr': 'Complément'
        },
        'format': {'type': 'complement'}
    },
    'characterization': {
        'id': None,
        'name': 'characterization',
        'label': {
            'en': 'Characterization',
            'fr': 'Caractérisation'
        },
        'format': {'type': 'characterization'}
    },
}


def fixture(fixture_manager, factory_manager):
    from accession.api.batchactiontype import BatchActionTypeFactory

    factory = BatchActionTypeFactory()
    factory_manager.register(factory)

    factory.create_or_update(factory_manager, BATCH_ACTION_TYPES, False)
