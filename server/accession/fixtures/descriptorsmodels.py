# -*- coding: utf-8; -*-
#
# @file descriptorsmodels.py
# @brief Setup the value for the accession passport models and types of models of descriptors.
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2017-01-03
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

MODELS = {
    'MCPD_ACCESSION_PASSPORT': {
        'id': None,
        'name': 'MCPD_ACCESSION_PASSPORT',
        'verbose_name': 'Accession passport',
        'description': 'Passport model for accession based on MCPD.',
        'types': [
            {
                'id': None,
                'name': 'MCPD_SAMPSTAT',
                'descriptor_type_name': 'biological_status',
                'label': {'en': 'Biological status', 'fr': 'Status biologique'},
                'mandatory': False,
                'set_once': False
            },
            {
                'id': None,
                'name': 'MCPD_ACQDATE',
                'descriptor_type_name': 'acquisition_date',
                'label': {'en': 'Acquisition date', 'fr': "Date d'acquisition"},
                'mandatory': False,
                'set_once': False
            },
            {
                'id': None,
                'name': 'MCPD_ANCEST',
                'descriptor_type_name': 'pedigree',
                'label': {'en': 'Pedigree', 'fr': 'Pédigré'},
                'mandatory': False,
                'set_once': False
            },
            {
                'id': None,
                'name': 'MCPD_ORIGCTY',
                'descriptor_type_name': 'country_of_origin',
                'label': {'en': 'Origin country', 'fr': "Pays d'origine"},
                'mandatory': False,
                'set_once': False
            },
            {
                'id': None,
                'name': 'MCPD_DONORNAME',
                'descriptor_type_name': 'donor_institution_name',
                'label': {'en': 'Donnor name', 'fr': 'Nom du donateur'},
                'mandatory': False,
                'set_once': False
            }
        ]
    },
    'BATCH_GENERAL': {
        'id': None,
        'name': 'BATCH_GENERAL',
        'verbose_name': 'Batch general model',
        'description': 'Base model for batch based on MCPD accession.',
        'types': [
            {
                'id': None,
                'name': 'BATCH_CREATDATE',
                'descriptor_type_name': 'creation_date',
                'label': {'en': 'Creation date', 'fr': "Date de création"},
                'mandatory': False,
                'set_once': False
            },
            {
                'id': None,
                'name': 'BATCH_DESTRDATE',
                'descriptor_type_name': 'destruction_date',
                'label': {'en': 'Destruction date', 'fr': "Date de destruction"},
                'mandatory': False,
                'set_once': False
            },
        ]
    }
}


def fixture(fixture_manager):
    fixture_manager.create_or_update_models(MODELS)
