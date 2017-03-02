# -*- coding: utf-8 -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
Setup the value for the country descriptors.
"""

import json
import sys
import os.path

from descriptor.models import DescriptorType
from .descriptorstypes import DESCRIPTORS


def fixture(fixture_manager):
    sys.stdout.write("   + Create descriptors values for accession_synonym_types...\n")

    # load JSON data
    handler = open(os.path.join('accession', 'fixtures', 'accessionsynonymtypes.json'), 'rU')
    data = json.loads(handler.read())
    handler.close()

    descriptor = DESCRIPTORS.get('accession_synonym_types')
    descriptor_values = {}

    # curate data
    for lang, values in data.items():
        values_dict = {}

        for code, value in values.items():
            values_dict[code] = {
                'value0': value['name']
            }

        descriptor_values[lang] = values_dict

    if descriptor is not None and descriptor_values is not None:
        DescriptorType.objects.filter(name=descriptor['name']).update(values=json.dumps(descriptor_values))
