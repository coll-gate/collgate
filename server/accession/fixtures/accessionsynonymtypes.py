# -*- coding: utf-8; -*-
#
# @file accessionsynonymtypes.py
# @brief 
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2016-09-01
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

"""
Setup the value for the country descriptors.
"""

def fixture(fixture_manager):
    data = fixture_manager.load_json('accession', 'accessionsynonymtypes.json')

    # descriptor = DESCRIPTORS.get('accession_synonym_types')
    fixture_manager.create_or_update_values('accession_synonym_types', data, trans=True, inline=True)

