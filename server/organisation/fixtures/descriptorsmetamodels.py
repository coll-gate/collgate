# -*- coding: utf-8; -*-
#
# @file descriptorsmetamodels.py
# @brief Setup the value for the organisation meta-models and types of models of descriptors.
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2017-01-03
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

META_MODELS = {
    'organisation': {
        'id': None,
        'name': 'organisation',
        'target': 'organisation.organisation',
        'label': {'en': 'Organisation', 'fr': 'Organisation'},
        'description': "Unique meta-model for an organisation entity.",
        'panels': [
            {
                'id': None,
                'label': {'en': 'Common', 'fr': 'Commun'},
                'descriptor_model_name': 'organisation'
            }
        ]
    },
    'establishment': {
        'id': None,
        'name': 'establishment',
        'target': 'organisation.establishment',
        'label': {'en': 'Establishment', 'fr': 'Implantation'},
        'description': "Unique meta-model for an establishment of an organisation entity.",
        'panels': [
            {
                'id': None,
                'label': {'en': 'Common', 'fr': 'Commun'},
                'descriptor_model_name': 'establishment'
            }
        ]
    }
}


def fixture(fixture_manager, factory_manager):
    fixture_manager.create_or_update_meta_models(META_MODELS)
