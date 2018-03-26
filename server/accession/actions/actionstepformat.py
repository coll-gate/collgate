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

from accession.models import Accession


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

    def validate(self, action_type_format, data, columns):
        """
        Validate the value according the format.
        :param action_type_format: Format of the related action type
        :param data: Value to validate
        :param columns: Format of the colums of data
        :return: None if the validation is done, else a string with the error detail
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

    def process(self, action, step_data, input_data):
        """
        Process the specialized action step to the given action, using input array,
        and complete the step data structure.
        :param action: Valid and already existing action in DB.
        :param step_data: Initialized step data structure to be filled during process.
        :param input_data Input data corresponding to the output from the previous step or None if no previous step
        :return:
        """
        pass


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

        res = act.validate(step_format, data)
        if res is not None:
            raise ValueError(res)

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
    - Input : Accession(s)
    - Output : One or many batche(s)
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

    def process(self, action, step_data, input_data):
        pass
        # # retrieve each accession, 1 accession per row (what about input format mapping ? @todo)
        # accessions_id = [int(accession_id) for accession_id in inputs]
        #
        # if Accession.objects.filter(id__in=accessions_id).count() != len(accessions_id):
        #     raise ActionError("Some accessions ids does not exists")
        #
        # # generate output, simply the input
        # step_data['outputs'] = accessions_id


class ActionStepAccessionList(ActionStepFormat):
    """
    Wait for a simple list of accession (0, 1 or more accession in the input array).
    - Input :
    - Output : Copy of the array of accessions
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

    def process(self, action, step_data, input_data):
        """
        Check the data array and the existences of the accessions.
        """
        # if input_data is not None and step_data['data']:
        #     raise ActionError("Accession list action step take its own data set")

        # inputs is a list a accession id
        inputs = step_data['data']

        if Accession.objects.filter(id__in=inputs).count() != len(inputs):
            raise ActionError("Some accessions ids does not exists")


class ActionStepAccessionRefinement(ActionStepFormat):
    """
    Refine the collection of accession in input. The input is updated.
    - Input : Accession(s)
    - Output : Accessions(s)
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
        return None

    def check(self, action_controller, action_type_format):
        return None

    def process(self, action, step_data, input_data):
        steps_data = action.data.get('steps', [])

        # inputs = self.inputs(action, input_array)
        # @todo


class ActionStepBatchConsumerBatchProducer(ActionStepFormat):
    """
    Action step taking batches in input, and produce batches in output.
    - Input : Batche(s)
    - Output : Batche(s)
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

    def process(self, action, step_data, input_data):
        # @todo
        # name_builder = NameBuilderManager.get(NameBuilderManager.GLOBAL_BATCH)
        # naming_constants = self.naming_constants(
        #     name_builder.num_constants,
        #     accession.data('naming_options'),
        #     self.action_type.data('naming_options'))
        #
        # descriptors_map = {}      # @todo from config
        #
        # batch_layout = self.batch_layout(accession)
        #
        # # now create the initial batch
        # batch = Batch()
        # batch.name = name_builder.pick(self.naming_variables(accession.name, accession.code), naming_constants)
        #
        # batch.accession = accession
        # batch.layout = batch_layout
        #
        # # @todo set configured descriptors (date, type...)
        #
        # batch.save()
        #
        # action.output_batches.add(batch)
        pass


class ActionStepBatchConsumerBatchModifier(ActionStepFormat):
    """
    Action step taking batches in input, and modifying them.
    - Input : Batche(s)
    - Output : Batche(s)
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

    def process(self, action, step_data, input_data):
        steps_data = action.data.get('steps', [])

        # inputs = self.inputs(action, input_array)
        # @todo
