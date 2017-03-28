# -*- coding: utf-8 -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
Setup the value for the country descriptors.
"""

def fixture(fixture_manager):
    data = fixture_manager.load_json('accession', 'accessionsynonymtypes.json')

    # descriptor = DESCRIPTORS.get('accession_synonym_types')
    fixture_manager.create_or_update_values('accession_synonym_types', data, trans=True, inline=True)
