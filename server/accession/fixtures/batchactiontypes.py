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
        'format': {}
    },
    'multiplication': {
        'id': None,
        'name': 'multiplication',
        'label': {
            'en': 'Multiplication',
            'fr': 'Multiplication'
        },
        'format': {}
    },
    'regeneration': {
        'id': None,
        'name': 'regeneration',
        'label': {
            'en': 'Regeneration',
            'fr': 'Regeneration'
        },
        'format': {}
    },
    'test': {
        'id': None,
        'name': 'test',
        'label': {
            'en': 'Test',
            'fr': 'Test'
        },
        'format': {}
    },
    'cleanup': {
        'id': None,
        'name': 'cleanup',
        'label': {
            'en': 'Nettoyage',
            'fr': 'Clean-up'
        },
        'format': {}
    },
    'sample': {
        'id': None,
        'name': 'sample',
        'label': {
            'en': 'Sample',
            'fr': 'Echantillon'
        },
        'format': {}
    },
    'dispatch': {
        'id': None,
        'name': 'dispatch',
        'label': {
            'en': 'Dispatch',
            'fr': 'Dispatch'
        },
        'format': {}
    },
    'elimination': {
        'id': None,
        'name': 'elimination',
        'label': {
            'en': 'Elimination',
            'fr': 'Elimination'
        },
        'format': {}
    },
}


def fixture(fixture_manager, factory_manager):
    from accession.api.batchactiontype import BatchActionTypeFactory

    factory = BatchActionTypeFactory()
    factory_manager.register(factory)

    factory.create_or_update(factory_manager, BATCH_ACTION_TYPES, False)
