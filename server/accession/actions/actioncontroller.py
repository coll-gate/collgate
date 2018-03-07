# -*- coding: utf-8; -*-
#
# @file actioncontroller.py
# @brief collgate 
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2018-01-05
# @copyright Copyright (c) 2018 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details

from django.contrib.contenttypes.models import ContentType
from django.db import transaction, IntegrityError
from django.utils.translation import ugettext_lazy as _

from accession.models import Layout, ActionType, ActionToEntity
from accession.namebuilder import NameBuilderManager

from accession.actions.actionstepformat import ActionStepFormatManager, ActionStepFormat, ActionError
from accession.models import Action, Batch
from accession.namebuilder import NameBuilderManager


class ActionController(object):
    """
    Action controller. Permit to setup and later update the state of an action instance.
    """

    STEP_INIT = 0
    STEP_SETUP = 1
    STEP_DONE = 2

    def __init__(self, action_type_or_action, user=None):
        if type(action_type_or_action) is ActionType:
            self.action_type = action_type_or_action
            self.user = user
            self.action = None
        elif type(action_type_or_action) is Action:
            self.action_type = action_type_or_action.action_type
            self.user = action_type_or_action.user
            self.action = action_type_or_action

        self.accession_content_type_id = ContentType.objects.get_by_natural_key('accession', 'accession').id
        self.batch_content_type_id = ContentType.objects.get_by_natural_key('accession', 'batch').id
        self.descriptor_content_type_id = ContentType.objects.get_by_natural_key('descriptor', 'descriptor').id

    def action_content_type(self, step_format_type):
        """
        Convert the entity type from the action step format IO_* to its content type id.
        """
        if step_format_type == ActionStepFormat.IO_ACCESSION_ID:
            return self.accession_content_type_id
        elif step_format_type == ActionStepFormat.IO_BATCH_ID:
            return self.batch_content_type_id
        if step_format_type == ActionStepFormat.IO_DESCRIPTOR:
            return self.descriptor_content_type_id
        else:
            raise ActionError("Unsupported action IO entity type")

    def create(self, name, description):
        """
        Create a new action using a name.
        :param name: Informative name str
        :param description: Description str
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
        action.description = description
        action.action_type = self.action_type

        # initial data structure
        data = {'steps': []}
        action.data = data

        self.action = action

        # and init the first step
        if self.has_more_steps:
            self.add_step_data()

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
            return True

        # then at least one element
        step_index = len(action_steps) - 1
        action_step = action_steps[step_index]

        return action_step.get('state', ActionController.STEP_INIT) == ActionController.STEP_DONE

    @property
    def has_more_steps(self):
        action_type_steps = self.action_type.format['steps']
        action_steps = self.action.data['steps']

        return len(action_type_steps) > len(action_steps)

    def add_step_data(self):
        # check if the last step is done
        if not self.is_current_step_done:
            raise ActionError(_("Current action step if not done"))

        action_type_steps = self.action_type.format['steps']
        action_steps = self.action.data['steps']

        # no more steps
        if len(action_type_steps) == len(action_steps):
            raise ActionError(_("No more action steps"))

        step_data = {
            'state': ActionController.STEP_INIT,
            'index': len(self.action.data['steps']),
            'options': None,
            'data': None
        }

        self.action.data['steps'].append(step_data)
        return step_data

    def setup_data(self, input_data, input_columns):
        if not self.is_current_step_valid:
            raise ActionError("Invalid current action step")

        if self.is_current_step_done:
            raise ActionError("Current action step is already done")

        # step format
        action_type_steps = self.action_type.format['steps']

        action_steps = self.action.data['steps']
        step_index = len(action_steps) - 1

        step_format = action_type_steps[step_index]
        action_step_format = ActionStepFormatManager.get(step_format['type'])

        if not action_step_format.accep_user_data:
            raise ActionError("Current step does not accept data from user")

        action_step = action_steps[step_index]

        # check step state
        action_step_state = action_step.get('state', ActionController.STEP_INIT)
        if action_step_state != ActionController.STEP_INIT and action_step_state != ActionController.STEP_SETUP:
            raise ActionError("Current action step state must be initial or setup")

        # validate data according to step format
        action_step_format.validate(step_format, input_data, input_columns)

        action_step['state'] = ActionController.STEP_SETUP
        action_step['data'] = input_data

        # finally save
        self.action.save()

    def process_current_step(self):
        if not self.is_current_step_valid:
            raise ActionError("Invalid current action step")

        if self.is_current_step_done:
            raise ActionError("Current action step is already done")

        # step format
        action_type_steps = self.action_type.format['steps']

        action_steps = self.action.data['steps']
        step_index = len(action_steps) - 1

        step_format = action_type_steps[step_index]
        action_step_format = ActionStepFormatManager.get(step_format['type'])

        action_step = action_steps[step_index]

        # check step state
        action_step_state = action_step.get('state', ActionController.STEP_INIT)
        if action_step_state != ActionController.STEP_SETUP:
            raise ActionError("Current action step state must be setup")

        if step_index > 0:
            input_array = action_step[step_index-1]['data']
        else:
            input_array = None

        action_step_format.process(self.action, action_step, input_array)
        action_step['state'] = ActionController.STEP_DONE

        # and init the next one
        if self.has_more_steps:
            self.add_step_data()

        # save and make associations
        try:
            with transaction.atomic():
                self.action.save()

                # and add the related refs
                self.update_related_entities(step_index)
        except IntegrityError as e:
            raise ActionError(e)

    def reset_current_step(self):
        # step format
        action_steps = self.action.data.get('steps')
        if not action_steps:
            raise ActionError("Empty action steps")

        action_steps = self.action.data['steps']
        step_index = len(action_steps) - 1

        action_step = action_steps[step_index]

        # check step state
        action_step_state = action_step.get('state', ActionController.STEP_INIT)
        if action_step_state != ActionController.STEP_SETUP:
            raise ActionError("Current action step state must be setup")

        step_data = {
            'state': ActionController.STEP_INIT,
            'index': step_index,
            'options': None,
            'data': None
        }

        action_steps[step_index] = step_data

        # finally save
        self.action.save()

    def update_related_entities(self, step_index):
        """
        After processing a step, the related table of entities must be updated to easily lookup for which entities
        an action is related to.
        """
        action_steps = self.action.data.get('steps')
        if not action_steps:
            raise ActionError("Empty action steps")

        action_steps = self.action.data['steps']

        if step_index >= len(action_steps):
            raise ActionError("Action step index out of range")

        action_step = action_steps[step_index]

        # check step state
        action_step_state = action_step.get('state', ActionController.STEP_INIT)
        if action_step_state != ActionController.STEP_DONE:
            raise ActionError("Current action step state must be done")

        # step format
        action_type_steps = self.action_type.format['steps']

        step_format = action_type_steps[step_index]
        action_step_format = ActionStepFormatManager.get(step_format['type'])

        missing = []

        self.get_missing_entities(action_step['data'], action_step_format.input_format, missing)

        # now for missing entities bulk create them
        ActionToEntity.objects.bulk_create(missing)

    def get_missing_entities(self, array, array_format, results):
        # initiates the types
        entity_ids_by_type = [[] for x in range(0, ActionStepFormat.NUM_IO_TYPES)]
        entity_exists_by_type = [set() for x in range(0, ActionStepFormat.NUM_IO_TYPES)]

        # for each non referenced entity input add it. first split objects by type and look
        for e_id in array:
            for ei in array_format:
                entity_ids_by_type[ei].append(e_id)

        for ei in array_format:
            qs = ActionToEntity.objects.filter(
                action_id=self.action.id,
                id__in=entity_ids_by_type[ei],
                entity_type=self.action_content_type(ei)).values_list('id', flat=True)

            for e in qs:
                entity_exists_by_type[ei].add(e)

            # compute the diff
        for ei in array_format:
            local_set = entity_exists_by_type[ei]
            content_type_id = self.action_content_type(ei)

            for e_id in entity_ids_by_type[ei]:
                if e_id not in local_set:
                    results.append(ActionToEntity(
                        action_id=self.action.id,
                        entity_id=e_id,
                        entity_type_id=content_type_id,
                    ))
