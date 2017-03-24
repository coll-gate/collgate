# -*- coding: utf-8 -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
Setup the value for the mcpd biological_status descriptor.
"""

# from .descriptorstypes import DESCRIPTORS


def fixture(fixture_manager):
    data = fixture_manager.load_json('accession', 'mcpdtypes.json')

    # descriptor = DESCRIPTORS.get('accession_synonym_types')
    fixture_manager.create_or_update_values('biological_status', data, trans=True, inline=False)