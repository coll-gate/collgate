# -*- coding: utf-8 -*-
#
# Copyright (c) 2017 INRA UMR1095 GDEC


"""
Setup the value for the organisation meta-models and types of models of descriptors.
"""
import json
import sys

from django.contrib.contenttypes.models import ContentType

from descriptor.models import DescriptorMetaModel, DescriptorPanel
from .descriptorsmodels import MODELS


META_MODELS = {
    'organisation': {
        'id': None,
        'name': 'organisation',
        'target': 'organisation.organisation',
        'label': {'en': 'Organisation', 'fr': 'Organisation'},
        'description': "Unique meta-model for an organisation entity.",
        'panels': [
            {
                'id': None,
                'label': {'en': 'Common', 'fr': 'Commun'},
                'descriptor_model_name': 'organisation'
            }
        ]
    },
    'establishment': {
        'id': None,
        'name': 'establishment',
        'target': 'organisation.establishment',
        'label': {'en': 'Establishment', 'fr': 'Implantation'},
        'description': "Unique meta-model for an establishment of an organisation entity.",
        'panels': [
            {
                'id': None,
                'label': {'en': 'Common', 'fr': 'Commun'},
                'descriptor_model_name': 'establishment'
            }
        ]
    }
}


def fixture():
    sys.stdout.write(" + Create organisation meta-models...\n")

    for k, v in META_MODELS.items():
        meta_model_name = v['name']

        content_type = ContentType.objects.get_by_natural_key(*v['target'].split('.'))

        meta_model, created = DescriptorMetaModel.objects.update_or_create(
            name=meta_model_name,
            defaults={
                'label': json.dumps(v['label']),
                'description': v['description'],
                'target': content_type}
        )

        position = 0

        for panel in v['panels']:
            descriptor_model = MODELS[panel['descriptor_model_name']]

            panel_name = "%i_%i" % (meta_model.id, descriptor_model['id'])

            panel_model, created = DescriptorPanel.objects.update_or_create(
                name=panel_name,
                defaults={
                    'descriptor_meta_model': meta_model,
                    'descriptor_model_id': descriptor_model['id'],
                    'label': json.dumps(panel['label']),
                    'position': position
                }
            )

            panel['id'] = panel_model.id
            position += 1

        # keep id for others fixtures
        v['id'] = meta_model.id
