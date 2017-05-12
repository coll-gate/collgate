# -*- coding: utf-8; -*-
#
# @file descriptorstypes.py
# @brief Setup the types of descriptors.
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2016-09-01
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

DESCRIPTORS = {
    'accession_synonym_types': {
        'id': None,
        'name': 'accession_synonym_types',
        'code': 'ACC_SYN',
        'group': 'accession',
        'can_delete': False,
        'can_modify': False,
        'description': 'List of types of synonyms for an accession',
        'format': {
            'type': 'enum_single',
            'fields': ['name'],
            'trans': True,
            'list_type': 'dropdown',
            'display_fields': 'value0',
            'sortby_field': 'value0'
        }
    },
    'biological_status': {
        'id': None,
        'name': 'biological_status',
        'code': 'MCPD_SAMPSTAT',
        'group': 'MCPD',
        'can_delete': False,
        'can_modify': False,
        'description': 'Biological status of an accession',
        'format': {
            'type': 'enum_pair',
            'fields': ['classification', 'value'],
            'trans': True,
            'list_type': 'dropdown',
            'display_fields': 'hier0-value1',
            'sortby_field': 'value0'
        }
    },
    'acquisition_date': {
        'id': None,
        'name': 'acquisition_date',
        'code': 'MCPD_ACQDATE',
        'group': 'MCPD',
        'can_delete': False,
        'can_modify': False,
        'description': 'Date on which the accession entered the collection',
        'format': {
            'type': 'imprecise_date'
        },
        '__comment': 'Not necessary to declare a specific descriptor type. Can use a generic type defined in common group. Need to choose if this is really a date or just a 4 characters string for the wheat sample data'
    },
    'pedigree': {
        'id': None,
        'name': 'pedigree',
        'code': 'MCPD_ANCEST',
        'group': 'MCPD',
        'can_delete': False,
        'can_modify': False,
        'description': 'Pedigree of an accession as free text, string with a maximum of 4000 characters',
        'format': {
            'type': 'string',
            'regexp': '^.{0,4000}$'
        },
        '__comment': 'Not necessary to declare a specific descriptor type. Can use a generic type defined in common group.'
    },
    'country_of_origin': {
        'id': None,
        'name': 'country_of_origin',
        'code': 'MCPD_ORIGCTY',
        'group': 'MCPD',
        'can_delete': False,
        'can_modify': False,
        'description': 'Country of origin of an accession',
        'format': {
            'type': 'country'
        },
        '__comment': 'Not necessary to declare a specific descriptor type. Can use a generic type defined in common group.'
    },
    'donor_institution_name': {
        'id': None,
        'name': 'donor_institution_name',
        'code': 'MCPD_DONORNAME',
        'group': 'MCPD',
        'can_delete': False,
        'can_modify': False,
        'description': 'Name of the donor institution of an accession, string with a maximum of 255 characters',
        'format': {
            'type': 'string',
            'regexp': '^.{0,255}$'
        },
        '__comment': 'Not necessary to declare a specific descriptor type. Can use a generic type defined in common group.'
    },
    'donor_accession_number': {
        'id': None,
        'name': 'donor_accession_number',
        'code': 'MCPD_DONORNNUMB',
        'group': 'MCPD',
        'can_delete': False,
        'can_modify': False,
        'description': 'Identifier assigned to an accession by the donor',
        'format': {
            'type': 'string',
            'regexp': '^.{0,255}$'
        },
        '__comment': 'Not necessary to declare a specific descriptor type. Can use a generic type defined in common group.'
    },
    'batch_creation_date': {
        'id': None,
        'name': 'batch_creation_date',
        'code': 'BATCH_CREATDATE',
        'group': 'BATCH',
        'can_delete': False,
        'can_modify': False,
        'description': 'Date on which the batch has been created',
        'format': {
            'type': 'imprecise_date'
        },
        '__comment': 'Not necessary to declare a specific descriptor type. Can use a generic type defined in common group.'
    },
    'batch_destruction_date': {
        'id': None,
        'name': 'batch_destruction_date',
        'code': 'BATCH_DESTRDATE',
        'group': 'BATCH',
        'can_delete': False,
        'can_modify': False,
        'description': 'Date on which the batch has been destroyed',
        'format': {
            'type': 'imprecise_date'
        },
        '__comment': 'Not necessary to declare a specific descriptor type. Can use a generic type defined in common group.'
    },
    'batch_comment': {
        'id': None,
        'name': 'batch_comment',
        'code': 'BATCH_COMMENT',
        'group': 'BATCH',
        'can_delete': False,
        'can_modify': False,
        'description': 'Comment',
        'format': {
            'type': 'string'
        },
        '__comment': 'Not necessary to declare a specific descriptor type. Can use a generic type defined in common group.'
    }
}


def fixture(fixture_manager):
    fixture_manager.create_or_update_types(DESCRIPTORS)
