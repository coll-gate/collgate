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

from accession.actiontypeformat import ActionTypeFormatManager, ActionTypeFormatCreation
from accession.actiontypeformat import ActionController
from accession.models import ActionType, Action, Batch
from accession.namebuilder import NameBuilderManager
from descriptor.models import DescriptorMetaModel as Layout


class ActionMultiplication(ActionController):

    def __init__(self, action_type_format):
        super().__init__(action_type_format)

    def create(self, action_type, accession, user, input_batches=None):
        if not input_batches:
            raise Exception("This batch action does take at least on batch in input")

        name_builder = NameBuilderManager.get(NameBuilderManager.GLOBAL_BATCH)

        # @todo we need here 3 namings constants arrays (one per type of produced batch)
        naming_constants = self.naming_constants(
            name_builder.num_constants,
            accession.data('naming_options', [None]*3),  # [0]
            action_type.data('naming_options'))

        descriptors_map = {}      # @todo from config

        try:
            with transaction.atomic():
                batch_action = Action()
                batch_action.user = user
                batch_action.accession = accession

                data = {
                    'status': 'created',
                    'type': self.type_format.name
                }

                batch_action.type = action_type
                batch_action.data = data

                batch_action.save()

                # batch_layout = self.batch_layout(accession)

                # setup input batches
                batch_action.input_batches.add(*input_batches)

                # for each input batch create one output batch
                for in_batch in input_batches:
                    # depend of the context, here we want 3 new dedicated batches

                    # @todo make 3 for 1 and take related naming_constants
                    batch = Batch()
                    batch.name = name_builder.pick(self.naming_variables(accession.name, accession.code),
                                                   naming_constants)

                    batch.accession = accession
                    batch.descriptor_meta_model = in_batch.descriptor_meta_model
                    batch.descriptors = in_batch.descriptors

                    # @todo update configured descriptors (date, type...)
                    batch.save()

                    # parent batch for the newly created
                    batch.batches.add(in_batch)

                    # and one more output batch for the action
                    batch_action.output_batches.add(batch)

                return batch_action
        except IntegrityError:
            raise Exception("Unable to create an new action (%s)" % self.type_format.name)

    def update(self, action, user):
        pass
