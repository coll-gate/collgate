# -*- coding: utf-8 -*-
#
# Copyright (c) 2017 INRA UMR1095 GDEC


"""
Setup the value for the organisation models and types of models of descriptors.
"""

import json
import sys

from descriptor.models import DescriptorModel, DescriptorModelType

MODELS = {
    'organisation': {
        'id': None,
        'name': 'organisation',
        'verbose_name': 'Organisation',
        'description': 'Model for an organisation.',
        'types': [
        ]
    },
    'establishment': {
        'id': None,
        'name': 'establishment',
        'verbose_name': 'Establishment',
        'description': 'Model for an establishment of organisation.',
        'types': [
        ]
    }
}


def fixture():
    sys.stdout.write(" + Create organisation models...\n")

    for k, v in MODELS.items():
        model_name = v['name']

        model, created = DescriptorModel.objects.update_or_create(
            name=model_name,
            defaults={'verbose_name': v['verbose_name'], 'description': v['description']}
        )

        # keep id for others fixtures
        MODELS[model_name]['id'] = model.id
