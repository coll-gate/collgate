# -*- coding: utf-8 -*-
#
# Copyright (c) 2017 INRA UMR1095 GDEC

"""
Setup the model of descriptor for the organisation module.
"""

import json
import sys
import os.path

from descriptor.models import DescriptorType, DescriptorValue
from .descriptorstypes import DESCRIPTORS


def fixture(fixture_manager):
    sys.stdout.write("   + Create descriptors models...\n")

    # load JSON data
    handler = open(os.path.join('organisation', 'fixtures', 'organisationstypes.json'), 'rU')
    data = json.loads(handler.read())
    handler.close()

    descriptor = DESCRIPTORS.get('organisations_types')

    if descriptor is not None:
        descriptor_type_id = fixture_manager.get_descriptor_type_id(descriptor['name'])

        # insert/update data
        for lang, values in data.items():
            for code, value in values.items():
                DescriptorValue.objects.update_or_create(code=code, language=lang, defaults={
                    'descriptor_id': descriptor_type_id,
                    'code': code,
                    'language': lang,
                    'value0': value
                })
