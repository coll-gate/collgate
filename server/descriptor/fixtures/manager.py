# -*- coding: utf-8; -*-
#
# @file manager.py
# @brief 
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2017-01-03
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details Install the initials asset of data for each application that needs it.

from __future__ import unicode_literals, absolute_import, division

import json
import os
import sys

from django.contrib.contenttypes.models import ContentType

from classification.models import Classification
from main.models import EntitySynonymType
# from ..models import Descriptor, DescriptorModel, DescriptorModelType, \
#     Layout, DescriptorPanel, DescriptorValue

from ..models import Descriptor, Layout, DescriptorValue


class FixtureManager:
    """
    API to help making per module fixtures on descriptors and on type of synonyms.
    """

    def __init__(self):
        self.descriptor_types = {}
        self.descriptor_models = {}
        self.layouts = {}

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

    def set_layout(self, name, obj_id):
        self.layouts[name] = {
            'id': obj_id,
            'name': name
        }

    def get_descriptor_id(self, name):
        # local search first
        type_id = self.descriptor_types.get(name, {'id': None})['id']
        if type_id is None:
            try:
                type_id = Descriptor.objects.get(name=name).id
            except Descriptor.DoesNotExist:
                return None

        return type_id

    # def get_descriptor_model_id(self, name):
    #     # local search first
    #     model_id = self.descriptor_models.get(name, {'id': None})['id']
    #     if model_id is None:
    #         try:
    #             model_id = DescriptorModel.objects.get(name=name).id
    #         except DescriptorModel.DoesNotExist:
    #             return None
    #
    #     return model_id

    def get_layout_id(self, name):
        # local search first
        layout_id = self.layouts.get(name, {'id': None})['id']
        if layout_id is None:
            try:
                layout_id = Layout.objects.get(name=name).id
            except Layout.DoesNotExist:
                return None

        return layout_id

    @staticmethod
    def load_json(module_name, file_name):
        handler = open(os.path.join(module_name, 'fixtures', file_name), 'rU')
        data = json.loads(handler.read())
        handler.close()

        return data

    def create_or_update_types(self, descriptor_types):
        sys.stdout.write("   + Create descriptors types...\n")

        for k, descriptor_data in descriptor_types.items():
            descriptor_name = descriptor_data['name']

            if k != descriptor_name:
                raise ValueError('Descriptor key name differs from value name (%s)' % descriptor_name)

            sys.stdout.write("   + Descriptor %s\n" % descriptor_name)

            type_format = descriptor_data.get('format', {})

            descriptor, created = Descriptor.objects.update_or_create(name=descriptor_name, defaults={
                'code': descriptor_data.get('code', ''),
                'description': descriptor_data.get('description', ''),
                'group_name': descriptor_data.get('group_name', None),
                'format': type_format,
                'can_delete': descriptor_data.get('can_delete', False),
                'can_modify': descriptor_data.get('can_modify', False)
            })

            # keep id for others fixtures
            descriptor_data['id'] = descriptor.id

            # lookup table
            self.set_descriptor_type(descriptor_name, descriptor.id)

    # def create_or_update_models(self, descriptor_models):
    #     sys.stdout.write("   + Create descriptor models...\n")
    #
    #     for k, descriptor_model_data in descriptor_models.items():
    #         descriptor_model_name = descriptor_model_data['name']
    #
    #         if k != descriptor_model_name:
    #             raise ValueError('Descriptor model key name differs from value name (%s)' % descriptor_model_name)
    #
    #         descriptor_model, created = DescriptorModel.objects.update_or_create(
    #             name=descriptor_model_name,
    #             defaults={
    #                 'verbose_name': descriptor_model_data['verbose_name'],
    #                 'description': descriptor_model_data['description']
    #             }
    #         )
    #
    #         # keep id for others fixtures
    #         descriptor_model_data['id'] = descriptor_model.id
    #
    #         # lookup table
    #         self.set_descriptor_model(descriptor_model_name, descriptor_model.id)
    #
    #         position = 0
    #
    #         for model_type_data in descriptor_model_data['types']:
    #             model_type_name = model_type_data.get('name')
    #             if model_type_data is None:
    #                 model_type_name = "%s_%s" % (descriptor_model_data['name'], model_type_data['descriptor_type_name'])
    #
    #             descriptor_type_id = self.get_descriptor_type_id(model_type_data['descriptor_type_name'])
    #
    #             descriptor_model_type, created = DescriptorModelType.objects.update_or_create(
    #                 name=model_type_name, defaults={
    #                     'descriptor_model': descriptor_model,
    #                     'label': model_type_data.get('label', {}),
    #                     'mandatory': model_type_data.get('mandatory', False),
    #                     'set_once': model_type_data.get('set_once', False),
    #                     'position': position,
    #                     'descriptor_type_id': descriptor_type_id,
    #                     'index': model_type_data.get('index', 0)
    #                 }
    #             )
    #
    #             # keep id and generated name for others fixtures
    #             model_type_data['id'] = descriptor_model_type.id
    #             model_type_data['name'] = model_type_name
    #
    #             position += 1

    def create_or_update_layouts(self, layouts):
        sys.stdout.write("   + Create descriptor layouts...\n")

        # first pass, create/update any layouts without parameters (let to default)
        for k, v in layouts.items():
            layout_name = v['name']

            content_type = ContentType.objects.get_by_natural_key(*v['target'].split('.'))

            layout, created = Layout.objects.update_or_create(
                name=layout_name,
                defaults={
                    'label': v['label'],
                    'description': v['description'],
                    'target': content_type
                }
            )

            position = 0
            print(v['structure'])

            # for panel in v['structure']:
            #     descriptor_model_id = self.get_descriptor_model_id(panel['descriptor_model_name'])
            #
            #     panel_model, created = DescriptorPanel.objects.update_or_create(
            #         layout=layout,
            #         descriptor_model_id=descriptor_model_id,
            #         defaults={
            #             'label': panel['label'],
            #             'position': position
            #         }
            #     )
            #
            #     panel['id'] = panel_model.id
            #     position += 1
            #
            #     # create indexes
            #     dmts = panel_model.descriptor_model.descriptor_model_types.all()
            #     for dmt in dmts:
            #         content_type_model = content_type.model_class()
            #         dmt.create_or_drop_index(content_type_model)
            #
            # # keep id for others fixtures
            # v['id'] = layout.id

            # lookup table
            self.set_layout(layout_name, layout.id)

        # second pass, update parameters and make relations with foreign keys
        for k, v in layouts.items():
            layout_name = v['name']
            has_updated = False

            try:
                layout = Layout.objects.get(name=layout_name)
            except Layout.DoesNotExist:
                raise

            parameters = v.get('parameters', {'type': 'undefined'})
            parameters_type = parameters.get('type', 'undefined')

            if parameters.get('data') is None:
                continue

            # @todo a LayoutParameter management according to type
            # LayoutManager.update_parameters(layout, parameters)

            final_parameters = {
                'type': parameters_type,
                'data': {}
            }

            if parameters_type == 'accession.accession':
                # primary classification model
                primary_classification_name = parameters['data'].get('primary_classification')

                if primary_classification_name is None:
                    continue

                try:
                    primary_classification = Classification.objects.get(name=primary_classification_name)
                except Classification.DoesNotExist:
                    raise

                final_parameters['data']['primary_classification'] = primary_classification.id

                # allow batches layout list
                batch_layout_list = parameters['data'].get('batch_layouts', [])
                batch_layout_id_list = []

                for batch_layout_name in batch_layout_list:
                    batch_layout_id = self.get_layout_id(batch_layout_name)

                    if batch_layout_id is None:
                        try:
                            batch_layout = Layout.objects.get(name=batch_layout_name)
                        except Layout.DoesNotExist:
                            raise

                        batch_layout_id = batch_layout.id

                    batch_layout_id_list.append(batch_layout_id)

                final_parameters['data']['batch_layouts'] = batch_layout_id_list

                layout.parameters = final_parameters
                has_updated = True
            else:
                pass

            if has_updated:
                layout.save()

    def create_or_update_values(self, descriptor_type_name, data, trans=False, inline=False):
        sys.stdout.write("   + Create descriptors values for %s...\n" % descriptor_type_name)

        descriptor = self.descriptor_types.get(descriptor_type_name)

        if inline:
            descriptor_values = {}

            if trans:
                for lang, values in data.items():
                    values_dict = {}

                    for code, value in values.items():
                        result = {
                            'value0': value['value0']
                        }

                        tmp = value.get('value1')
                        if tmp:
                            result['value1'] = tmp

                        tmp = value.get('ordinal')
                        if tmp:
                            result['ordinal'] = tmp

                        tmp = value.get('parent')
                        if tmp:
                            result['parent'] = tmp

                        values_dict[code] = result

                    descriptor_values[lang] = values_dict
            else:
                values_dict = {}

                for code, value in data.items():
                    result = {
                        'value0': value['value0']
                    }

                    tmp = value.get('value1')
                    if tmp:
                        result['value1'] = tmp

                    tmp = value.get('ordinal')
                    if tmp:
                        result['ordinal'] = tmp

                    tmp = value.get('parent')
                    if tmp:
                        result['parent'] = tmp

                    values_dict[code] = result

                descriptor_values = values_dict

            if descriptor is not None and descriptor_values is not None:
                Descriptor.objects.filter(name=descriptor['name']).update(values=json.dumps(descriptor_values))
        else:
            if trans:
                for lang, values in data.items():
                    for code, value in values.items():
                        DescriptorValue.objects.update_or_create(code=code, language=lang, defaults={
                            'descriptor_id': descriptor['id'],
                            'parent': value.get('parent'),
                            'ordinal': value.get('ordinal'),
                            'value0': value.get('value0'),
                            'value1': value.get('value1'),
                        })
            else:
                for code, value in data.items():
                    DescriptorValue.objects.update_or_create(code=code, language='en', defaults={
                        'descriptor_id': descriptor['id'],
                        'parent': value.get('parent'),
                        'ordinal': value.get('ordinal'),
                        'value0': value.get('value0'),
                        'value1': value.get('value1'),
                    })

            # empty any previous inline values
            if descriptor is not None:
                Descriptor.objects.filter(name=descriptor['name']).update(values=None)

    def create_or_update_synonym_types(self, synonym_types, app_label, model_name):
        sys.stdout.write("   + Create types of synonym...\n")

        # get related model
        related_model = ContentType.objects.get_by_natural_key(app_label, model_name)

        # create/update any type of synonym
        for k, v in synonym_types.items():
            synonym_type_name = v['name']

            synonym_type_model, created = EntitySynonymType.objects.update_or_create(
                name=synonym_type_name,
                defaults={
                    'label': v['label'],
                    'unique': v.get('unique', False),
                    'multiple_entry': v.get('multiple_entry', False),
                    'has_language': v.get('has_language', True),
                    'target_model': related_model,
                    'can_delete': v.get('can_delete', True),
                    'can_modify': v.get('can_modify', True)
                }
            )

            # keep id for others fixtures
            v['id'] = synonym_type_model.id
