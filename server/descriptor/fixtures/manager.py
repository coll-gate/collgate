# -*- coding: utf-8 -*-
#
# Copyright (c) 2017 INRA UMR1095 GDEC

"""
Install the initials asset of data for each application that needs it.
"""

from __future__ import unicode_literals, absolute_import, division

import json
import sys

from django.contrib.contenttypes.models import ContentType

from ..models import DescriptorGroup, DescriptorType, DescriptorModel, DescriptorModelType,\
    DescriptorMetaModel, DescriptorPanel


class FixtureManager:
    """
    Lookup tables for descriptor like instances.
    """

    def __init__(self):
        self.descriptor_groups = {}
        self.descriptor_types = {}
        self.descriptor_models = {}
        self.descriptor_meta_models = {}

    def set_descriptor_group(self, name, obj_id):
        self.descriptor_groups[name] = {
            'id': obj_id,
            'name': name
        }

    def set_descriptor_type(self, name, obj_id):
        self.descriptor_types[name] = {
            'id': obj_id,
            'name': name
        }

    def set_descriptor_model(self, name, obj_id):
        self.descriptor_models[name] = {
            'id': obj_id,
            'name': name
        }

    def set_descriptor_meta_model(self, name, obj_id):
        self.descriptor_meta_models[name] = {
            'id': obj_id,
            'name': name
        }

    def get_descriptor_group_id(self, name):
        return self.descriptor_groups.get(name, {'id': None})['id']

    def get_descriptor_type_id(self, name):
        return self.descriptor_types.get(name, {'id': None})['id']

    def get_descriptor_model_id(self, name):
        return self.descriptor_models.get(name, {'id': None})['id']

    def get_descriptor_meta_model_id(self, name):
        return self.descriptor_meta_models.get(name, {'id': None})['id']

    def create_or_update_groups(self, groups):
        sys.stdout.write("   + Create descriptors types groups...\n")

        for k, group_data in groups.items():
            group_name = group_data['name']

            if k != group_name:
                raise ValueError('Group key name differs from value name (%s)' + group_name)

            group, created = DescriptorGroup.objects.update_or_create(name=group_name, defaults={
                'can_delete': group_data.get('can_delete', False),
                'can_modify': group_data.get('can_modify', False)
            })

            # keep id for others fixtures
            groups[group_name]['id'] = group.id

            # lookup table
            self.set_descriptor_group(group_name, group.id)

    def create_or_update_types(self, descriptor_types):
        sys.stdout.write("   + Create descriptors types...\n")

        for k, descriptor_data in descriptor_types.items():
            descriptor_name = descriptor_data['name']

            if k != descriptor_name:
                raise ValueError('Descriptor key name differs from value name (%s)' % descriptor_name)

            sys.stdout.write("   + Descriptor %s\n" % descriptor_name)

            type_format = descriptor_data.get('format', {})

            descriptor, created = DescriptorType.objects.update_or_create(name=descriptor_name, defaults={
                'code': descriptor_data.get('code', ''),
                'description': descriptor_data.get('description', ''),
                'group_id': self.get_descriptor_group_id(descriptor_data.get('group', 'common')),
                'format': json.dumps(type_format),
                'can_delete': descriptor_data.get('can_delete', False),
                'can_modify': descriptor_data.get('can_modify', False)
            })

            # keep id for others fixtures
            descriptor_data['id'] = descriptor.id

            # lookup table
            self.set_descriptor_type(descriptor_name, descriptor.id)

    def create_or_update_models(self, descriptor_models):
        sys.stdout.write("   + Create descriptor models...\n")

        for k, descriptor_model_data in descriptor_models.items():
            descriptor_model_name = descriptor_model_data['name']

            if k != descriptor_model_name:
                raise ValueError('Descriptor model key name differs from value name (%s)' % descriptor_model_name)

            descriptor_model, created = DescriptorModel.objects.update_or_create(
                name=descriptor_model_name,
                defaults={
                    'verbose_name': descriptor_model_data['verbose_name'],
                    'description': descriptor_model_data['description']
                }
            )

            # keep id for others fixtures
            descriptor_model_data['id'] = descriptor_model.id

            # lookup table
            self.set_descriptor_model(descriptor_model_name, descriptor_model.id)

            position = 0

            for model_type_data in descriptor_model_data['types']:
                model_type_name = model_type_data.get('name')
                if model_type_data is None:
                    model_type_name = "%s_%s" % (descriptor_model_data['name'], model_type_data['descriptor_type_name'])

                descriptor_type_id = self.get_descriptor_type_id(model_type_data['descriptor_type_name'])

                descriptor_model_type, created = DescriptorModelType.objects.update_or_create(
                    name=model_type_name, defaults={
                        'descriptor_model': descriptor_model,
                        'label': json.dumps(model_type_data.get('label', {})),
                        'mandatory': model_type_data.get('mandatory', False),
                        'set_once': model_type_data.get('set_once', False),
                        'position': position,
                        'descriptor_type_id': descriptor_type_id
                    }
                )

                # keep id and generated name for others fixtures
                model_type_data['id'] = descriptor_model_type.id
                model_type_data['name'] = model_type_name

                position += 1

    def create_or_update_meta_models(self, descriptor_meta_models):
        sys.stdout.write("   + Create descriptor meta-models...\n")

        for k, v in descriptor_meta_models.items():
            meta_model_name = v['name']

            content_type = ContentType.objects.get_by_natural_key(*v['target'].split('.'))

            descriptor_meta_model, created = DescriptorMetaModel.objects.update_or_create(
                name=meta_model_name,
                defaults={
                    'label': json.dumps(v['label']),
                    'description': v['description'],
                    'target': content_type}
            )

            position = 0

            for panel in v['panels']:
                descriptor_model_id = self.get_descriptor_model_id(panel['descriptor_model_name'])

                panel_name = "%i_%i" % (descriptor_meta_model.id, descriptor_model_id)

                panel_model, created = DescriptorPanel.objects.update_or_create(
                    name=panel_name,
                    defaults={
                        'descriptor_meta_model': descriptor_meta_model,
                        'descriptor_model_id': descriptor_model_id,
                        'label': json.dumps(panel['label']),
                        'position': position
                    }
                )

                panel['id'] = panel_model.id
                position += 1

            # keep id for others fixtures
            v['id'] = descriptor_meta_model.id

            # lookup table
            self.set_descriptor_meta_model(meta_model_name, descriptor_meta_model.id)
