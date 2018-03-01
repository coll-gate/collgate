# -*- coding: utf-8; -*-
#
# @file accession_layouts.py
# @brief Setup the value for the organisation layouts and types of models of descriptors.
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2017-01-03
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

LAYOUTS = {
    'organisation': {
        'id': None,
        'name': 'organisation',
        'target': 'organisation.organisation',
        'label': {'en': 'Organisation', 'fr': 'Organisation'},
        'description': "Unique layout for an organisation entity.",
        'layout_content': {
            'panels': [
                {
                    'label': {'en': 'Common', 'fr': 'Commun'},
                    'descriptors': [
                        {
                            'name': 'acronym_1',
                            'mandatory': False,
                            'set_once': False
                        },
                        {
                            'name': 'code_16',
                            'mandatory': False,
                            'set_once': False

                        },
                        {
                            'name': 'address',
                            'mandatory': False,
                            'set_once': False
                        },
                        {
                            'name': 'zipcode',
                            'mandatory': False,
                            'set_once': False
                        },
                        {
                            'name': 'city',
                            'mandatory': False,
                            'set_once': False
                        }
                    ]
                }
            ]
        }
    },
    'establishment': {
        'id': None,
        'name': 'establishment',
        'target': 'organisation.establishment',
        'label': {'en': 'Establishment', 'fr': 'Implantation'},
        'description': "Unique layout for an establishment of an organisation entity.",
        'layout_content': {
            'panels': [
                {
                    'label': {'en': 'Common', 'fr': 'Commun'},
                    'descriptors': [
                        {
                            'name': 'address',
                            'mandatory': False,
                            'set_once': False
                        },
                        {
                            'name': 'zipcode',
                            'mandatory': False,
                            'set_once': False
                        },
                        {
                            'name': 'city',
                            'mandatory': False,
                            'set_once': False
                        },
                        {
                            'name': 'code_16',
                            'mandatory': False,
                            'set_once': False
                        }
                    ]
                }
            ]
        }
    }
}


def fixture(fixture_manager, factory_manager):
    fixture_manager.create_or_update_layouts(LAYOUTS)
