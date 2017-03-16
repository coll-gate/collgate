# -*- coding: utf-8 -*-
#
# Copyright (c) 2017 INRA UMR1095 GDEC

"""
Setup the types of descriptors.
"""

import json
import sys

from descriptor.models import DescriptorType
from .descriptorsgroups import GROUPS

DESCRIPTORS = {
    'geolocation': {
        'id': None,
        'name': 'geolocation',
        'code': 'GE_001',
        'group': 'common',
        'can_delete': False,
        'can_modify': False,
        'description': 'Defines a default geolocation.',
        'format': {
            'type': 'geolocation'
        }
    }
}


def fixture(fixture_manager):
    fixture_manager.create_or_update_types(DESCRIPTORS)
