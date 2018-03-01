# -*- coding: utf-8;-*-
#
# @file descriptorsindexes.py
# @brief Setup the indexes.
# @author Medhi BOULNEMOUR (INRA UMR1095)
# @date 2018-02-28
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details

from descriptor.models import JSONBFieldIndexType

INDEXES = [
    {
        'id': None,
        'type': JSONBFieldIndexType.BTREE.value,
        'descriptor_name': 'acquisition_date',
        'target': 'accession.accession'
    }
]


def fixture(fixture_manager, factory_manager):
    fixture_manager.create_or_update_indexes(INDEXES)
