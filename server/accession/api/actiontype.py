# -*- coding: utf-8; -*-
#
# @file action.py
# @brief collgate 
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2017-11-30
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details

import sys

from accession.models import ActionType
from main.api.basefactory import BaseFactory


class ActionTypeFactory(BaseFactory):

    def __init__(self):
        super(ActionTypeFactory, self).__init__()

        self.name = "action_type"
        self.model = ActionType

    def create_or_update(self, manager, data, bulk=True):
        sys.stdout.write("   + Create types of action...\n")

        if type(data) is not dict:
            data = {
                data['name']: data
            }

        # create/update any type of action
        for k, v in data.items():
            action_type_name = v['name']

            action_type_model, created = ActionType.objects.update_or_create(
                name=action_type_name,
                defaults={
                    'label': v['label'],
                    'format': v['format']
                }
            )

            # save id
            v['id'] = action_type_model.id

            # cache
            self.set_entry(v['id'], v['name'], v)
