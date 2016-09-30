# -*- coding: utf-8 -*-

"""
Setup the value for the country descriptors.
"""
import json
import sys
import os.path

from ..models import DescriptorType
from .descriptorstypes import DESCRIPTORS


def fixture():
    sys.stdout.write(" + Create descriptors values for countries...\n")

    # load JSON data
    handler = open(os.path.join('accession', 'fixtures', 'countries.json'), 'rU')
    data = json.loads(handler.read())
    handler.close()

    descriptor = DESCRIPTORS.get('country2')
    results = {}

    # curate data
    for lang, subdata, in data.items():
        countries = {}

        for code, country in subdata.items():
            countries[code] = {
                'value0': country['name'],
                'value1': country.get('iso_a2')
            }

        results[lang] = countries

    if descriptor is not None and results is not None:
        DescriptorType.objects.filter(name=descriptor['name']).update(values=json.dumps(results))
