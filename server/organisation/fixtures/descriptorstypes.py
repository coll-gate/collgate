# -*- coding: utf-8; -*-
#
# @file descriptorstypes.py
# @brief Setup the types of descriptors.
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2017-01-03
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

DESCRIPTORS = {
    'organisations_types': {
        'id': None,
        'name': 'organisations_types',
        'code': 'ORG_TYPE',
        'group_name': 'organisation',
        'label': {'en': 'organisation type', 'fr': 'type d\'organisme'},
        'can_delete': False,
        'can_modify': True,
        'description': 'List of types of organisations for an organisation',
        'format': {
            'type': 'enum_single',
            'trans': True,
            'fields': ('type',),
            'list_type': 'dropdown',
            'display_fields': 'value0',
            'sortby_field': 'value0'
        }
    },
    'person_title': {
        'id': None,
        'name': 'person_title',
        'code': 'ORG_PERSON_TITLE',
        'group_name': 'organisation',
        'label': {'en': 'Title', 'fr': 'Civilité'},
        'can_delete': False,
        'can_modify': True,
        'description': 'List of types of titles for a person/contact',
        'format': {
            'type': 'enum_single',
            'trans': True,
            'fields': ('type',),
            'list_type': 'dropdown',
            'display_fields': 'value0',
            'sortby_field': 'value0'
        }
    },
    'full_name': {
        'id': None,
        'name': 'full_name',
        'code': 'ORG_FULL_NAME',
        'group_name': 'organisation',
        'label': {'en': 'Full name', 'fr': 'Nom complet'},
        'can_delete': False,
        'can_modify': True,
        'description': 'Full name (max 200 characters)',
        'format': {
            'type': 'string',
            'regexp': '^.{0,200}$'
        }
    },
    'first_name': {
        'id': None,
        'name': 'first_name',
        'code': 'ORG_FIRST_NAME',
        'group_name': 'organisation',
        'label': {'en': 'First name', 'fr': 'Prénom'},
        'can_delete': False,
        'can_modify': True,
        'description': 'First name (max 200 characters)',
        'format': {
            'type': 'string',
            'regexp': '^.{0,200}$'
        }
    },
    'last_name': {
        'id': None,
        'name': 'last_name',
        'code': 'ORG_LAST_NAME',
        'group_name': 'organisation',
        'label': {'en': 'Nom', 'fr': 'Nom'},
        'can_delete': False,
        'can_modify': True,
        'description': 'Nom (max 200 characters)',
        'format': {
            'type': 'string',
            'regexp': '^.{0,200}$'
        }
    },
    'phone_number': {
        'id': None,
        'name': 'phone_number',
        'code': 'ORG_PHONE_NUMBER',
        'group_name': 'organisation',
        'label': {'en': 'Phone', 'fr': 'Téléphone'},
        'can_delete': False,
        'can_modify': False,
        'description': 'Defines a simple phone number string with international format support.',
        'format': {
            'type': 'string',
            'regexp': '^\+*[0-9]{0,14}$'
        }
    },
    'fax_number': {
        'id': None,
        'name': 'fax_number',
        'code': 'ORG_FAX_NUMBER',
        'group_name': 'organisation',
        'label': {'en': 'Fax', 'fr': 'Fax'},
        'can_delete': False,
        'can_modify': False,
        'description': 'Defines a simple fax number string with international format support.',
        'format': {
            'type': 'string',
            'regexp': '^\+*[0-9]{0,14}$'
        }
    },
    'mobile_number': {
        'id': None,
        'name': 'mobile_number',
        'code': 'ORG_MOBILE_NUMBER',
        'group_name': 'organisation',
        'label': {'en': 'Mobile', 'fr': 'Portable'},
        'can_delete': False,
        'can_modify': False,
        'description': 'Defines a simple mobile number string with international format support.',
        'format': {
            'type': 'string',
            'regexp': '^\+*[0-9]{0,14}$'
        }
    },
    'email_address': {
        'id': None,
        'name': 'email_address',
        'code': 'ORG_EMAIL_ADDRESS',
        'group_name': 'organisation',
        'label': {'en': 'Email address', 'fr': 'Adresse email'},
        'can_delete': False,
        'can_modify': False,
        'description': 'Defines a simple email address string.',
        'format': {
            'type': 'string',
            'regexp': '^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
        }
    }
}


def fixture(fixture_manager, factory_manager):
    fixture_manager.create_or_update_descriptors(DESCRIPTORS)
