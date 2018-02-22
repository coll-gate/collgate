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
from django.utils.translation import ugettext_lazy as _

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
        data = accession.layout.parameters.get('data')
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

    @property
    def is_current_step_valid(self):
        # step format
        action_steps = self.action.data.get('steps')
        if not action_steps:
            return False

        # then at least one element
        step_index = len(action_steps) - 1
        action_step = action_steps[step_index]

        return action_step is not None

    @property
    def is_current_step_done(self):
        # step format
        action_steps = self.action.data.get('steps')
        if not action_steps:
            raise ActionError("Empty action steps")

        # then at least one element
        step_index = len(action_steps) - 1
        action_step = action_steps[step_index]

        return action_step.get('done', False)

    @property
    def has_more_steps(self):
        action_type_steps = self.action_type['steps']
        action_steps = self.action.data['steps']

        return len(action_type_steps) > len(action_steps)

    def add_step_data(self):
        # check if the last step is done
        if not self.is_current_step_done:
            raise ActionError(_("Current action step if not done"))

        action_type_steps = self.action_type['steps']
        action_steps = self.action.data['steps']

        # no more steps
        if len(action_type_steps) == len(action_steps):
            raise ActionError(_("No more action steps"))

        step_data = {
            'done': False,
            'index': len(self.action.data['steps']),
            'options': None,
            'inputs': None,
            'outputs': None
        }

        self.action.data['steps'].append(step_data)
        return step_data

    def setup_input(self, input_type, input_data):
        if not self.is_current_step_valid:
            raise ActionError("Invalid current action step")

        if self.is_current_step_done:
            raise ActionError("Current action step is already done")

        # step format
        action_type_steps = self.action_type['steps']
        step_index = len(action_type_steps) - 1

        step_format = action_type_steps[step_index]
        action_step_format = ActionStepFormatManager.get(step_format)

        action_step = self.action.data['steps'][step_index]

        # @todo check input according to step format
        # @todo according input_type

        # finally save
        self.action.save()

    def process_current_step(self):
        if not self.is_current_step_valid:
            raise ActionError("Invalid current action step")

        if self.is_current_step_done:
            raise ActionError("Current action step is already done")

        # step format
        action_type_steps = self.action_type['steps']
        step_index = len(action_type_steps) - 1

        step_format = action_type_steps[step_index]
        action_step_format = ActionStepFormatManager.get(step_format)

        action_step = self.action.data['steps'][step_index]

        action_step_format.process(self.action, action_step)

        # and init the next one
        if self.has_more_steps:
            self.add_step_data()

        # save and make associations
        try:
            with transaction.atomic():
                self.action.save()

                # and add the related refs
                # @todo
        except IntegrityError as e:
            raise ActionError(e)

    def reset_current_step(self):
        # step format
        action_steps = self.action.data.get('steps')
        if not action_steps:
            raise ActionError("Empty action steps")

        # then at least one element
        step_index = len(action_steps) - 1

        step_data = {
            'done': False,
            'index': step_index,
            'options': None,
            'inputs': None,
            'outputs': None
        }

        action_steps[step_index] = step_data

        # finally save
        self.action.save()
