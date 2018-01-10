# -*- coding: utf-8; -*-
#
# @file creation.py
# @brief collgate 
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2018-01-05
# @copyright Copyright (c) 2018 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details

from django.db import transaction, IntegrityError

from accession.batchactiontypeformat import BatchActionTypeFormatManager, BatchActionTypeFormatCreation
from accession.batchactiontypeformat import BatchActionController
from accession.models import BatchActionType, BatchAction, Batch
from accession.namebuilder import batch_name_builder
from descriptor.models import DescriptorMetaModel as Layout


class BatchActionCreation(BatchActionController):

    def __init__(self, batch_action_type_format):
        super().__init__(batch_action_type_format)

    def create(self, batch_action_type, accession, user):
        try:
            with transaction.atomic():
                batch_action = BatchAction()
                batch_action.user = user
                batch_action.accession = accession

                data = {
                    'status': 'created',
                    'type': self.type_format.name
                }

                batch_action.type = batch_action_type
                batch_action.data = data

                batch_action.save()

                # batch layout from accession layout information
                batch_layout_id = accession.descriptor_meta_model.parameters['data']['batch_descriptor_meta_models'][0]
                batch_layout = Layout.objects.get(pk=batch_layout_id)

                # now create the initial batch
                batch = Batch()
                batch.name = batch_name_builder[0].pick([])
                batch.accession = accession
                batch.descriptor_meta_model = batch_layout
                batch.save()

                batch_action.output_batches.add(batch)

        except IntegrityError:
            raise Exception("Unable to create an new action (%s)" % self.type_format.name)

    def update(self, batch_action, user):
        pass
