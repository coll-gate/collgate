# -*- coding: utf-8; -*-
#
# @file actionformattype
# @brief collgate action format type base class and manager
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2017-12-04
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details

from django.core.exceptions import ImproperlyConfigured
from django.utils.translation import ugettext_lazy as _, pgettext_lazy
from django.db import transaction, IntegrityError

from accession.models import Accession, Batch, AccessionPanel, PanelType
from accession.namebuilder import NameBuilderManager


class ActionError(BaseException):
    pass


class ActionStepFormatGroup(object):
    """
    Group of action type format.
    """

    def __init__(self, name, verbose_name):
        self.name = name
        self.verbose_name = verbose_name


class ActionInput(object):
    """
    Retrieves inputs for an action step.
    """

    def __init__(self, action):
        pass


class ActionStepFormat(object):
    """
    Action type step format base class.
    """

    IO_UNDEFINED = -1
    IO_ACCESSION_ID = 0
    IO_BATCH_ID = 1
    IO_DESCRIPTOR = 2
    NUM_IO_TYPES = 3

    def __init__(self):
        # name referred as a code, stored in format.type.
        self.name = ''

        # related group name
        self.group = None

        # i18n verbose name displayable for the client
        self.verbose_name = ''

        # accepted data format
        self.accept_format = ()

        # accept data from user
        self.accept_user_data = False

        # supported data format
        self.data_format = ()

        # true means that the processing of the step is per row of data and not in a single processing.
        self.iterative = False

    def validate(self, action_type_format, data, columns):
        """
        Validate the value according the format.
        :param action_type_format: Format of the related action type
        :param data: Value to validate
        :param columns: Format of the colums of data
        :return: Array if the validation is done, else throw an action exception
        """
        return None

    def check(self, action_controller, action_type_format):
        """
        Check the format of a descriptor type, if it is valid for a specific type of format.
        :param action_controller: Current action controller instance
        :param action_type_format: Format of type of the related action type to check
        :return: None if the check is done, else a string with the error detail
        """
        return None

    def naming_variables(self, accession):
        return {
            'ACCESSION_NAME': accession.name if accession else "",
            'ACCESSION_CODE': accession.code if accession else ""
        }

    def naming_constants(self, count, action_naming_options):
        constants = [""] * count

        # override with action parameters
        if action_naming_options:
            i = 0
            for opt in action_naming_options:
                constants[i] = opt
                i += 1

        return constants

    def data(self, action, default=None):
        """
        Returns the data array of the previous step to uses as input of the current.
        :param default: Returned array in case of initial state (new action).
        :param action: Valid action instance.
        :return: Array of input corresponding to the previous step output or to the default input array
        when there is no previous step.
        """
        steps_data = action.data.get('steps', [])
        current_step_index = len(steps_data)

        if current_step_index == 0:
            return default

        step_data = steps_data[current_step_index-1]

        if step_data is None:
            raise ActionError("Missing action step data")

        return step_data.get('data')

    def process(self, action_controller, step_format, step_data, prev_output_data, input_data):
        """
        Process the specialized action step to the given action, using input array,
        and complete the step data structure.
        :param action_controller: Action controller.
        :param step_format: Current step format.
        :param step_data: Initialized step data structure to be filled during process.
        :param prev_output_data: Data generated at the previous step or None
        :param input_data Input data of the current step or None
        :return:
        """
        return []

    def prepare_iterative_process(self, action_controller, step_format, step_data, prev_output_data, input_data):
        """
        Prepare the action step data before process iteratively the data array.
        :param action_controller: Action controller.
        :param step_format: Current step format.
        :param step_data: Initialized step data structure to be filled during process.
        :param prev_output_data: Data generated at the previous step or None
        :param input_data Input data of the current step or None
        :return:
        """
        return

    def process_iteration(self, action_controller, step_format, step_data, prev_output_data, input_data):
        """
        Process once more entity of the specialized action step to the given action, using input array,
        and complete the step data structure.
        :param action_controller: Action controller.
        :param step_format: Current step format.
        :param step_data: Initialized step data structure to be filled during process.
        :param prev_output_data: Data generated at the previous step or None
        :param input_data Input data of the current step or None
        :return:
        """
        return []


class ActionStepFormatManager(object):
    """
    Singleton manager of set of action step formats.
    """

    action_steps = {}

    @classmethod
    def register(cls, action_step_formats_list):
        """
        Register a list of action steps.
        :param action_step_formats_list: An array of action steps formats
        """
        # register each type into a map
        for step in action_step_formats_list:
            if step.name in cls.action_steps:
                raise ImproperlyConfigured("Format of action step already defined (%s)" % step.name)

            cls.action_steps[step.name] = step

    @classmethod
    def values(cls):
        """
        Return the list of any registered action step formats.
        """
        return list(cls.action_steps.values())

    @classmethod
    def get(cls, action_step_name):
        step = cls.action_steps.get(action_step_name)
        if step is None:
            raise ValueError("Unsupported format of action step %s" % action_step_name)

        return step

    @classmethod
    def validate(cls, action_step_name, data, columns):
        """
        Call the validate of the correct descriptor format type.
        :param action_step_name: Format of the type of action as python object
        :param data: Value to validate
        :param columns:
        :except ValueError with descriptor of the problem
        """
        step_format = action_step_name['type']

        act = cls.action_steps.get(step_format)
        if act is None:
            raise ValueError("Unsupported format of action step %s" % step_format)

        return act.validate(step_format, data)

    @classmethod
    def check(cls, action_controller, action_step_format):
        """
        Call the check of the correct descriptor format type.
        :param action_controller: Current action controller instance
        :param action_step_format: Format of the type of descriptor as python object
        :return: True if check success.
        :except ValueError with descriptor of the problem
        """
        step_format = action_step_format['type']

        act = cls.action_steps.get(step_format)
        if act is None:
            raise ValueError("Unsupported format of action step %s" % step_format)

        res = act.check(action_controller, action_step_format)
        if res is not None:
            raise ValueError(str(res))


class ActionFormatStepGroupStandard(ActionStepFormatGroup):
    """
    Group of standard steps.
    """

    def __init__(self):
        super().__init__("standard", _("Standard"))


class ActionStepAccessionConsumerBatchProducer(ActionStepFormat):
    """
    Action step that take accession in input and generate one ore more batches in output.
     - data : Accession(s)
     - output : Batche(s)
    """

    def __init__(self):
        super().__init__()

        self.name = "accessionconsumer_batchproducer"
        self.group = ActionFormatStepGroupStandard()
        self.verbose_name = _("Accession Consumer - Batch Producer")
        self.format_fields = ["type"]
        self.accept_format = (ActionStepFormat.IO_ACCESSION_ID,)
        self.data_format = (ActionStepFormat.IO_BATCH_ID,)

    def validate(self, action_type_format, data, columns):
        return None

    def check(self, action_controller, action_type_format):
        if "producers" not in action_type_format:
            raise ValueError("Missing field producers")

        if "options" not in action_type_format:
            raise ValueError("Missing field options")

        if type(action_type_format["producers"]) is not list:
            raise ValueError("The field producers must be an array")

        for producer in action_type_format["producers"]:
            # no options

            # check the naming constants
            constants = producer.get('naming_options')
            if constants is None:
                raise ValueError("Missing name builder constants array")

            if len(constants) != action_controller.name_builder.num_constants:
                raise ValueError("Number of name builder constants differs")

        return None

    def process(self, action_controller, step_format, step_data, prev_output_data, input_data):
        name_builder = NameBuilderManager.get(NameBuilderManager.GLOBAL_BATCH)

        accessions = Accession.objects.filter(id__in=prev_output_data)
        producers = step_format['producers']

        # find related descriptors
        descriptors = {}

        try:
            with transaction.atomic():
                batches = []

                for accession in accessions:
                    batch_layout = action_controller.batch_layout(accession)

                    for producer in producers:
                        naming_constants = self.naming_constants(
                            name_builder.num_constants,
                            producer['naming_options'])

                        batch = Batch()
                        batch.content_type = batch._get_content_type()  # because save method is not used in bulk
                        batch.name = name_builder.pick(self.naming_variables(accession), naming_constants)
                        batch.layout = batch_layout
                        batch.accession = accession

                        # defined descriptors
                        # @todo creation date... how to ?

                        batches.append(batch)

            # bulk create
            results = Batch.objects.bulk_create(batches)

            # take id from insert
            output = [x.pk for x in results]

        except IntegrityError as e:
            raise ActionError(e)

        return output


class ActionStepAccessionList(ActionStepFormat):
    """
    Wait for a simple list of accession (0, 1 or more accession in the input array).
     - data : none
     - output : Accession(s)
    """

    def __init__(self):
        super().__init__()

        self.name = "accession_list"
        self.group = ActionFormatStepGroupStandard()
        self.verbose_name = _("List of accessions")
        self.data_format = (ActionStepFormat.IO_ACCESSION_ID,)
        self.accept_user_data = True

    def validate(self, action_type_format, data, columns):
        p = 0
        idx = -1

        for col in columns:
            if col == ActionStepFormat.IO_ACCESSION_ID:
                idx = p
                break

            p += 1

        if idx < 0:
            raise ActionError(_("Data does not contains the accession_id column"))

        # only keep column of ids
        output = []

        if data:
            if isinstance(data[0], (tuple, list)):
                for r in data:
                    output.append(int(r[idx]))
            else:
                output = data

        return output

    def check(self, action_controller, action_type_format):
        # nothing to check
        return None

    def process(self, action_controller, step_format, step_data, prev_output_data, input_data):
        """
        Check the data array and the existences of the accessions.
        """
        if input_data is None:
            raise ActionError("Accession list is missing from step data")

        if Accession.objects.filter(id__in=input_data).count() != len(input_data):
            raise ActionError("Some accessions ids does not exists")

        # input as output
        return input_data


class ActionStepAccessionRefinement(ActionStepFormat):
    """
    Refine the collection of accession in input. The input is updated.
     - data : Accession(s)
     - output : Accessions(s)
    """

    def __init__(self):
        super().__init__()

        self.name = "accession_refinement"
        self.group = ActionFormatStepGroupStandard()
        self.verbose_name = _("Refine a list of accessions")
        self.accept_format = (ActionStepFormat.IO_ACCESSION_ID,)
        self.data_format = (ActionStepFormat.IO_ACCESSION_ID,)
        self.accept_user_data = True

    def validate(self, action_type_format, data, columns):
        p = 0
        idx = -1

        for col in columns:
            if col == ActionStepFormat.IO_ACCESSION_ID:
                idx = p
                break

            p += 1

        if idx < 0:
            raise ActionError(_("Data does not contains the accession_id column"))

        # only keep column of ids
        output = []

        if data:
            if isinstance(data[0], (tuple, list)):
                for r in data:
                    output.append(int(r[idx]))
            else:
                output = data

        return output

    def check(self, action_controller, action_type_format):
        return None

    def process(self, action_controller, step_format, step_data, prev_output_data, input_data):
        """
        Check the data array and the existences of the accessions, and compare if there is no foreign accessions.
        """
        if input_data is None:
            raise ActionError("Accession list is missing from step data")

        if prev_output_data is None:
            raise ActionError("Accession list from previous step is missing")

        # check for foreign accession id
        for acc_id in input_data:
            if acc_id not in prev_output_data:
                raise ActionError(_("The accession %i might not be in the list") % acc_id)

        # check for the existences of any accessions
        if Accession.objects.filter(id__in=input_data).count() != len(input_data):
            raise ActionError("Some accessions ids does not exists")

        # output as input
        return input_data


class ActionStepBatchConsumerBatchProducer(ActionStepFormat):
    """
    Action step taking batches in input, and produce batches in output.
     - data : Batche(s)
     - output : Batche(s)
    """

    def __init__(self):
        super().__init__()

        self.name = "batchconsumer_batchproducer"
        self.group = ActionFormatStepGroupStandard()
        self.verbose_name = _("Batch consumer - Batch producer")
        self.accept_format = (ActionStepFormat.IO_BATCH_ID,)
        self.data_format = (ActionStepFormat.IO_BATCH_ID,)

    def validate(self, action_type_format, data, columns):
        return None

    def check(self, action_controller, action_type_format):
        return None

    def process(self, action_controller, step_format, step_data, prev_output_data, input_data):
        name_builder = NameBuilderManager.get(NameBuilderManager.GLOBAL_BATCH)

        batches = Batch.objects.filter(id__in=prev_output_data).prefetch_related('accession')
        producers = step_format['producers']

        # find related descriptors
        descriptors = {}

        try:
            with transaction.atomic():
                output_batches = []

                for batch in batches:
                    batch_layout = action_controller.batch_layout(batch.accession)

                    for producer in producers:
                        naming_constants = self.naming_constants(
                            name_builder.num_constants,
                            producer['naming_options'])

                        out_batch = Batch()
                        out_batch.content_type = out_batch._get_content_type()  # because save method is not used in bulk
                        out_batch.name = name_builder.pick(self.naming_variables(batch.accession), naming_constants)
                        out_batch.layout = batch_layout

                        # defined descriptors
                        # @todo creation date... how to ?

                        output_batches.append(out_batch)

                # bulk create
                results = Batch.objects.bulk_create(output_batches)

                # take id from insert
                output = [x.pk for x in results]

        except IntegrityError as e:
            raise ActionError(e)

        return output

    def process_iteration(self, action_controller, step_format, step_data, prev_output_data, input_data):
        return []  # @todo


class ActionStepBatchConsumerBatchModifier(ActionStepFormat):
    """
    Action step taking batches in input, and modifying them.
     - data : Batche(s)
     - output : Batche(s)
    """

    def __init__(self):
        super().__init__()

        self.name = "batchconsumer_batchmodifier"
        self.group = ActionFormatStepGroupStandard()
        self.verbose_name = _("Batch consumer - Batch modifier")
        self.accept_format = (ActionStepFormat.IO_BATCH_ID,)
        self.data_format = (ActionStepFormat.IO_BATCH_ID,)

    def validate(self, action_type_format, data, columns):
        return None

    def check(self, action_controller, action_type_format):
        return None

    def process(self, action_controller, step_format, step_data, prev_output_data, input_data):
        name_builder = NameBuilderManager.get(NameBuilderManager.GLOBAL_BATCH)

        batches = Batch.objects.filter(id__in=prev_output_data).prefetch_related('accession')
        producers = step_format['producers']

        # find related descriptors
        descriptors = {}

        try:
            with transaction.atomic():
                output_batches = []

                for batch in batches:
                    batch_layout = action_controller.batch_layout(batch.accession)

                    for producer in producers:
                        naming_constants = self.naming_constants(
                            name_builder.num_constants,
                            producer['naming_options'])

                        out_batch = Batch()
                        out_batch.content_type = out_batch._get_content_type()  # because save method is not used in bulk
                        out_batch.name = name_builder.pick(self.naming_variables(batch.accession), naming_constants)
                        out_batch.layout = batch_layout

                        # defined descriptors
                        # @todo creation date... how to ?

                        output_batches.append(out_batch)

                # bulk create
                results = Batch.objects.bulk_create(output_batches)

                # take id from insert
                output = [x.pk for x in results]

        except IntegrityError as e:
            raise ActionError(e)

        return output


# @todo having a sequential processing for batch modification


class ActionStepAccessionConsumerBatchProducerIt(ActionStepAccessionConsumerBatchProducer):
    """
    Similar as accession consumer batch producer but generate output batch one by one.
     - data : Accession(s)
     - output : Batche(s)
    """

    def __init__(self):
        super().__init__()

        self.name = "accessionconsumer_batchproducer_it"
        self.verbose_name = _("Accession Consumer - Batch Producer iterative")
        self.iterative = True

        # @todo prepare descriptors
        # for now descriptor are defined into options but are not editable by users

    def prepare_iterative_process(self, action_controller, step_format, step_data, prev_output_data, input_data):
        limit = len(prev_output_data) // len(self.accept_format)
        step_data['progression'] = [0, limit]

        # and store the process list of items into a working panel
        accession_panel = AccessionPanel()
        accession_panel.name = '__%s.$tmp' % action_controller.action.name
        accession_panel.panel_type = PanelType.WORKING.value
        accession_panel.save()

        # previous input data is an array of accession ids
        accession_panel.accessions.add(prev_output_data)

    def process_iteration(self, action_controller, step_format, step_data, prev_output_data, input_data):
        name_builder = NameBuilderManager.get(NameBuilderManager.GLOBAL_BATCH)

        accessions = Accession.objects.filter(id__in=prev_output_data)
        producers = step_format['producers']

        # find related descriptors
        descriptors = {}

        offset = step_format['progression'][0]
        limit = step_format['progression'][0]
        stride = len(self.accept_format)

        # @todo one by one and use of progression counter

        try:
            with transaction.atomic():
                batches = []

                for accession in accessions:
                    batch_layout = action_controller.batch_layout(accession)

                    for producer in producers:
                        naming_constants = self.naming_constants(
                            name_builder.num_constants,
                            producer['naming_options'])

                        batch = Batch()
                        batch.content_type = batch._get_content_type()  # because save method is not used in bulk
                        batch.name = name_builder.pick(self.naming_variables(accession), naming_constants)
                        batch.layout = batch_layout
                        batch.accession = accession

                        # defined descriptors
                        # @todo creation date... how to ?

                        batches.append(batch)

            # bulk create
            results = Batch.objects.bulk_create(batches)

            # take id from insert
            output = [x.pk for x in results]

        except IntegrityError as e:
            raise ActionError(e)

        return output
