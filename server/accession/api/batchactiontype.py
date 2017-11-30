# -*- coding: utf-8; -*-
#
# @file batchactiontype.py
# @brief collgate 
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2017-11-30
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details

import sys

from accession.models import BatchActionType
from main.api.basefactory import BaseFactory


class BatchActionTypeFactory(BaseFactory):

    def __init__(self):
        super(BatchActionTypeFactory, self).__init__()

        self.name = "action_type"
        self.model = BatchActionType

    def create_or_update(self, data):
        sys.stdout.write("   + Create types of batch action...\n")

        if type(data) is not dict:
            data = {
                data['name']: data
            }

        # create/update any type of batch action
        for k, v in data.items():
            action_type_name = v['name']

            action_type_model, created = BatchActionType.objects.update_or_create(
                name=action_type_name,
                defaults={
                    'label': v['label'],
                    'format': v['format']
                }
            )

            # save id
            v['id'] = action_type_model.id

            # cache
            self.set(v['id'], v['name'], v)
