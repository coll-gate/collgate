# -*- coding: utf-8 -*-

"""
Setup the value for the country descriptors.
"""
import json
import sys
import os.path

from ..models import DescriptorType, DescriptorValue
from .descriptorstypes import DESCRIPTORS


def fixture():
    sys.stdout.write(" + Create descriptors values for countries...\n")

    # load JSON data
    handler = open(os.path.join('accession', 'fixtures', 'countries.json'), 'rU')
    data = json.loads(handler.read())
    handler.close()

    descriptor = DESCRIPTORS.get('country')

    if not descriptor or not descriptor.get('id'):
        raise Exception('Missing country descriptor')

    descriptor_object = DescriptorType.objects.get(id=descriptor['id'])

    # curate data
    for lang, subdata, in data.items():
        countries = {}

        for code, country in subdata.items():
            value = DescriptorValue()

            value.descriptor = descriptor_object

            value.name = "%s:%s" % (code, lang)
            value.language = lang
            value.code = code

            value.value0 = country['name']
            value.value1 = country.get('iso_a2')

            value.save()

            # keep for cities
            descriptor['lookup'][value.value1] = code
