# -*- coding: utf-8; -*-
#
# @file multiplication
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
from accession.namebuilder import NameBuilderManager
from descriptor.models import DescriptorMetaModel as Layout


class BatchActionMultiplication(BatchActionController):

    def __init__(self, batch_action_type_format):
        super().__init__(batch_action_type_format)

    def create(self, batch_action_type, accession, user, input_batches=None):
        naming_constants = ['M']  # @todo from config

        if input_batches is None:
            input_batches = []

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
                # batch_layout = Layout.objects.get(pk=batch_layout_id)

                in_batches = Batch.objects.find(pk__in=input_batches)

                # setup input batch
                batch_action.input_batches = in_batches

                # for each input batch create one output batch
                for in_batch in in_batches:
                    batch = Batch()
                    batch.name = NameBuilderManager.get(NameBuilderManager.GLOBAL_BATCH).pick(
                        self.naming_variables, naming_constants)

                    batch.accession = accession
                    batch.descriptor_meta_model = in_batch.descriptor_meta_model
                    batch.descriptors = in_batch.descriptors

                    # @todo update some normalized descriptors (date, type...)
                    batch.save()

                batch_action.output_batches.add(batch)

        except IntegrityError:
            raise Exception("Unable to create an new action (%s)" % self.type_format.name)

    def update(self, batch_action, user):
        pass
