# -*- coding: utf-8; -*-
#
# @file actioncontroller.py
# @brief collgate 
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2018-01-05
# @copyright Copyright (c) 2018 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details

from django.db import transaction, IntegrityError

from accession.models import DescriptorMetaModel as Layout, ActionType
from accession.namebuilder import NameBuilderManager

from accession.actions.actionstepformat import ActionStepFormatManager, ActionStepFormat, ActionError
from accession.models import Action, Batch
from accession.namebuilder import NameBuilderManager


class ActionController(object):
    """
    Action controller. Permit to setup and later update the state of an action instance.
    """

    def __init__(self, action_type_or_action, user=None):
        if type(action_type_or_action) is ActionType:
            self.action_type = action_type_or_action
            self.user = user
            self.action = None
        elif type(action_type_or_action) is Action:
            self.action_type = action_type_or_action.action_type
            self.user = action_type_or_action.user
            self.action = action_type_or_action

    def add_step_data(self, inputs=None):
        if inputs is None:
            inputs = []

        step_data = {
            'index': len(self.action.data['steps_data']),
            'inputs': inputs,
            'outputs': []
        }

        self.action.data['steps_data'].append(step_data)

        return step_data

    def create(self, name, input_array=None):
        """
        Create a new action using a name and process the first step using the input array.
        :param name: Informative name
        :param input_array: Empty or batch or accession array
        :return: A newly created action instance
        """
        if input_array is None:
            input_array = []

        if self.action is not None:
            raise ActionError("Action already exists")

        if self.action_type is None:
            raise ActionError("Action type must be non null")

        if self.user is None:
            raise ActionError("User must be non null")

        # create the action and set it empty
        action = Action()
        action.name = name  # informative name
        action.user = self.user
        action.type = self.action_type

        # initial data structure
        data = {
            'next_step': 0,
            'steps_data': []
        }

        action.data = data
        action.save()

        self.action = action

        # and process the first step
        self.process_step(input_array)

        return action

    def process_step(self, input_array=None):
        if input_array is None:
            input_array = []

        # step format
        action_step_format = ActionStepFormatManager.get(self.action_type)

        step_data = self.add_step_data(input_array)

        action_step_format.process(self.action, input_array, step_data)

        # finally save
        self.action.save()

    @property
    def name_builder(self):
        """
        Get the related name builder. Default to the global one's.
        """
        return NameBuilderManager.get(NameBuilderManager.GLOBAL_BATCH)

    def batch_layout(self, accession):
        """
        Return the batch layout model from the given accession layout parameters.
        """
        data = accession.descriptor_meta_model.parameters.get('data')
        if not data:
            return None

        # @todo merge 'batch_layout'
        batch_layouts = data.get('batch_descriptor_meta_models')

        if not batch_layouts:
            return None

        batch_layout_id = batch_layouts[0]
        try:
            batch_layout = Layout.objects.get(pk=batch_layout_id)
        except Layout.DoesNotExist:
            return None

        return batch_layout

 #        name_builder = NameBuilderManager.get(NameBuilderManager.GLOBAL_BATCH)
 #
 #        # @todo we need here 3 namings constants arrays (one per type of produced batch)
 #        naming_constants = self.naming_constants(
 #            name_builder.num_constants,
 #            accession.data('naming_options', [None]*3),  # [0]
 #            action_type.data('naming_options'))
 #
 #        descriptors_map = {}      # @todo from config
 #
 #        try:
 #            with transaction.atomic():
 #                batch_action = Action()
 #                batch_action.user = user
 #                batch_action.accession = accession
 #
 #                data = {
 #                    'status': 'created',
 #                    'type': self.type_format.name
 #                }
 #
 #                batch_action.type = action_type
 #                batch_action.data = data
 #
 #                batch_action.save()
 #
 #                # batch_layout = self.batch_layout(accession)
 #
 #                # setup input batches
 #                batch_action.input_batches.add(*input_batches)
 #
 #                # for each input batch create one output batch
 #                for in_batch in input_batches:
 #                    # depend of the context, here we want 3 new dedicated batches
 #
 #                    # @todo make 3 for 1 and take related naming_constants
 #                    batch = Batch()
 #                    batch.name = name_builder.pick(self.naming_variables(accession.name, accession.code),
 #                                                   naming_constants)
 #
 #                    batch.accession = accession
 #                    batch.descriptor_meta_model = in_batch.descriptor_meta_model
 #                    batch.descriptors = in_batch.descriptors
 #
 #                    # @todo update configured descriptors (date, type...)
 #                    batch.save()
 #
 #                    # parent batch for the newly created
 #                    batch.batches.add(in_batch)
 #
 #                    # and one more output batch for the action
 #                    batch_action.output_batches.add(batch)
 #
 #                return batch_action
 #        except IntegrityError:
 #            raise Exception("Unable to create an new action (%s)" % self.type_format.name)