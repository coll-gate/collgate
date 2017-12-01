# -*- coding: utf-8; -*-
#
# @file mcpdtypes.py
# @brief Setup the value for the mcpd biological_status descriptor.
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2016-09-01
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 


def fixture(fixture_manager, factory_manager):
    data = fixture_manager.load_json('accession', 'mcpdtypes.json')

    fixture_manager.create_or_update_values('biological_status', data, trans=True)
