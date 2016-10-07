# -*- coding: utf-8 -*-

"""
Setup the value for the cities descriptors.
"""
import json
import sys
import os.path

from ..models import DescriptorType, DescriptorValue
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
        sys.stdout.write(" -> city: %i/%i\n" % (count, total))

        for lang in ['en', 'fr']:
            value = DescriptorValue()

            value.descriptor = descriptor_object

            value.name = "%s:%07i:%s" % (descriptor['code'], int(city['_id']), lang)
            value.code = "%s:%07i" % (descriptor['code'], int(city['_id']))
            value.language = lang

            value.value0 = city['name']
            value.value1 = "%s,%s" % (city['coord']['lon'], city['coord']['lat'])

            # not read during this transaction
            # countries = DescriptorValue.objects.filter(value0=city['country'])
            # if countries.exists():
            #     value.parent = countries[0].code

            country_code = country_descriptor['lookup'].get(city['country'])
            if country_code:
                value.parent = country_code

            value.save()

        count += 1
