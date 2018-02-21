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

from accession.models import Layout, ActionType
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
            'index': len(self.action.data['steps']),
            'inputs': inputs,
            'outputs': []
        }

        self.action.data['steps'].append(step_data)

        return step_data

    def create(self, name):
        """
        Create a new action using a name.
        :param name: Informative name
        :return: A newly created action instance
        """
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
        action.action_type = self.action_type

        # initial data structure
        data = {'steps': []}

        action.data = data

        action.save()
        return action

    def process_step(self, step_index, input_array=None):
        if input_array is None:
            input_array = []

        # step format
        action_type_steps = self.action_type['steps']
        if step_index >= len(action_type_steps):
            raise ActionError("Action type step index out of range")

        step_format = action_type_steps[step_index]
        action_step_format = ActionStepFormatManager.get(step_format)

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

        batch_layouts = data.get('batch_layout')

        if not batch_layouts:
            return None

        batch_layout_id = batch_layouts[0]
        try:
            batch_layout = Layout.objects.get(pk=batch_layout_id)
        except Layout.DoesNotExist:
            return None

        return batch_layout
