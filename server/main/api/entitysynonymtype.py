# -*- coding: utf-8; -*-
#
# @file synonymtype
# @brief collgate 
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2017-11-30
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

import sys

from django.contrib.contenttypes.models import ContentType

from main.models import EntitySynonymType
from main.api.basefactory import BaseFactory


class EntitySynonymTypeFactory(BaseFactory):

    def __init__(self):
        super(EntitySynonymTypeFactory, self).__init__()

        self.name = "action_type"
        self.model = EntitySynonymType

    def create_or_update(self, manager, data, bulk=True, app_label=None, model_name=None):
        sys.stdout.write("   + Create types of synonym...\n")

        # get related model
        related_model = ContentType.objects.get_by_natural_key(app_label, model_name)

        if type(data) is not dict:
            data = {
                data['name']: data
            }

        # create/update any type of synonym
        for k, v in data.items():
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

            # cache
            self.set_entry(v['id'], v['name'], v)
