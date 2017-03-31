# -*- coding: utf-8 -*-
#
# Copyright (c) 2017 INRA UMR1095 GDEC

"""
Setup the value for the organisation models and types of models of descriptors.
"""

MODELS = {
    'organisation': {
        'id': None,
        'name': 'organisation',
        'verbose_name': 'Organisation',
        'description': 'Model for an organisation.',
        'types': [
            {
                'id': None,
                'name': 'organisation_acronym',
                'descriptor_type_name': 'acronym_1',
                'label': {'en': 'Acronym', 'fr': 'Acronyme'},
                'mandatory': False,
                'set_once': False
            },
            {
                'id': None,
                'name': 'organisation_code',
                'descriptor_type_name': 'code_16',
                'label': {'en': 'Organisation code', 'fr': 'Code organisation'},
                'mandatory': False,
                'set_once': False
            },
            {
                'id': None,
                'name': 'organisation_address',
                'descriptor_type_name': 'address',
                'label': {'en': 'Address', 'fr': 'Adresse'},
                'mandatory': False,
                'set_once': False
            },
            {
                'id': None,
                'name': 'organisation_zipcode',
                'descriptor_type_name': 'zipcode',
                'label': {'en': 'ZIP code', 'fr': 'Code postal'},
                'mandatory': False,
                'set_once': False
            },
            {
                'id': None,
                'name': 'organisation_geolocation',
                'descriptor_type_name': 'country',
                'label': {'en': 'Location', 'fr': 'Localisation'},
                'mandatory': False,
                'set_once': False
            }
        ]
    },
    'establishment': {
        'id': None,
        'name': 'establishment',
        'verbose_name': 'Establishment',
        'description': 'Model for an establishment of organisation.',
        'types': [
            {
                'id': None,
                'name': 'establishment_address',
                'descriptor_type_name': 'address',
                'label': {'en': 'Address', 'fr': 'Adresse'},
                'mandatory': False,
                'set_once': False
            },
            {
                'id': None,
                'name': 'establishment_zipcode',
                'descriptor_type_name': 'zipcode',
                'label': {'en': 'ZIP code', 'fr': 'Code postal'},
                'mandatory': False,
                'set_once': False
            },
            {
                'id': None,
                'name': 'establishment_geolocation',
                'descriptor_type_name': 'country',
                'label': {'en': 'Location', 'fr': 'Localisation'},
                'mandatory': False,
                'set_once': False
            },
            {
                'id': None,
                'name': 'establishment_code',
                'descriptor_type_name': 'code_16',
                'label': {'en': 'Code', 'fr': 'Code'},
                'mandatory': False,
                'set_once': False
            }
        ]
    }
}


def fixture(fixture_manager):
    fixture_manager.create_or_update_models(MODELS)
