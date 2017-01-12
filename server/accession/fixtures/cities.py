# -*- coding: utf-8 -*-

"""
Setup the value for the cities descriptors.
"""
import json
import sys
import os.path

from descriptor.models import DescriptorType, DescriptorValue
from .descriptorstypes import DESCRIPTORS


def fixture():
    sys.stdout.write(" + Create descriptors values for cities...\n")

    # load JSON data
    handler = open(os.path.join('accession', 'fixtures', 'cities.json'), 'rU')
    data = json.loads(handler.read())
    handler.close()

    descriptor = DESCRIPTORS.get('city')
    country_descriptor = DESCRIPTORS.get('country')

    if not descriptor or not descriptor.get('id'):
        raise Exception('Missing city descriptor')

    descriptor_object = DescriptorType.objects.get(id=descriptor['id'])

    count = 1
    total = len(data)

    # curate and insert data
    for city in data:
        if (count % 1000) == 0:
            sys.stdout.write(" -> city: %i/%i\n" % (count, total))

        for lang in ['en', 'fr']:
            name = "%s:%07i:%s" % (descriptor['code'], int(city['_id']), lang)
            code = "%s:%07i" % (descriptor['code'], int(city['_id']))
            value0 = city['name']
            value1 = "%s,%s" % (city['coord']['lon'], city['coord']['lat'])

            # not read during this transaction (lookup table)
            country_code = country_descriptor['lookup'].get(city['country'])
            if country_code:
                parent = country_code
            else:
                parent = None

            value, create = DescriptorValue.objects.get_or_create(
                descriptor=descriptor_object,
                name=name,
                code=code,
                parent=parent,
                language=lang,
                value0=value0,
                value1=value1,
            )

        count += 1
