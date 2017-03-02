# -*- coding: utf-8 -*-
#
# Copyright (c) 2017 INRA UMR1095 GDEC

"""
Setup the value for the organisation meta-models and types of models of descriptors.
"""

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


def fixture(fixture_manager):
    fixture_manager.create_or_update_meta_models(META_MODELS)
