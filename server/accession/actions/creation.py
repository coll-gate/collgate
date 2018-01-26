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

from accession.actiontypeformat import ActionTypeFormatManager, ActionTypeFormatCreation
from accession.actiontypeformat import ActionController
from accession.models import ActionType, Action, Batch
from accession.namebuilder import NameBuilderManager
from descriptor.models import DescriptorMetaModel as Layout


class ActionCreation(ActionController):

    def __init__(self, action_type_format):
        super().__init__(action_type_format)

    def create(self, action_type, accession, user, input_batches=None):
        if input_batches:
            raise Exception("This batch action does not take any batches in input")

        # @todo if we prefer introduction process then accession must be null and created during this process

        name_builder = NameBuilderManager.get(NameBuilderManager.GLOBAL_BATCH)
        naming_constants = self.naming_constants(
            name_builder.num_constants,
            accession.data('naming_options'),
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

                batch_layout = self.batch_layout(accession)

                # now create the initial batch
                batch = Batch()
                batch.name = name_builder.pick(self.naming_variables(accession.name, accession.code), naming_constants)

                batch.accession = accession
                batch.descriptor_meta_model = batch_layout

                # @todo set configured descriptors (date, type...)

                batch.save()

                batch_action.output_batches.add(batch)

                return batch_action
        except IntegrityError as e:
            raise Exception("Unable to create an new action (%s)" % self.type_format.name)

    def update(self, action, user):
        pass
