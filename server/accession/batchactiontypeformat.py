# -*- coding: utf-8; -*-
#
# @file batchactionformattype
# @brief collgate batch action format type base class and manager
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2017-12-04
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details

from django.core.exceptions import ImproperlyConfigured
from django.utils.translation import ugettext_lazy as _, pgettext_lazy

from accession.models import DescriptorMetaModel as Layout
from accession.namebuilder import NameBuilderManager


class BatchActionTypeFormatGroup(object):
    """
    Group of batch action type format.
    """

    def __init__(self, name, verbose_name):
        self.name = name
        self.verbose_name = verbose_name


class BatchActionController(object):
    """
    Batch action controller base class.
    It defines the interface to create or update the action, and to manage its related batches.
    """

    def __init__(self, batch_action_type_format):
        self.type_format = batch_action_type_format

    def naming_variables(self, accession):
        return {
            'ACCESSION_NAME': accession.name,
            'ACCESSION_CODE': accession.code
        }

    def naming_constants(self, count, accession, batch_action):
        constants = ["" for x in range(0, count)]

        # first retrieve constants from accession layout
        data = accession.descriptor_meta_model.parameters.get('data')
        if data:
            opts = data.get('naming_options')
            if opts:
                i = 0
                for opt in opts:
                    constants[i] = opt
                    i += 1

        # and override with batch action parameters
        opts_data = batch_action.format.get('data')
        if opts_data:
            naming_options = opts_data.get('naming_options')

            if naming_options:
                i = 0
                for opt in naming_options:
                    constants[i] = opt
                    i += 1

        return constants

    @property
    def name_builder(self):
        """
        Get the related name builder. Default to the global batch one's.
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
        layouts = data.get('batch_descriptor_meta_models')

        if not layouts:
            return None

        batch_layout_id = layouts[0]
        try:
            batch_layout = Layout.objects.get(pk=batch_layout_id)
        except Layout.DoesNotExist:
            return None

        return batch_layout

    def create(self, batch_action_type, accession, user, input_batches=None):
        """
        Creation step of the batch action.
        :param batch_action_type: Instance of the batch action type model
        :param accession: Related accession
        :param user: User actor of the creation
        :param input_batches: List of input batches or None if not necessary for the action
        :return The new batch action saved model
        """
        return None

    def update(self, batch_action, user):
        """
        Update step of the batch action.
        :param batch_action: A valid existing in DB batch action instance to be updated.
        :param user: User actor of this operation
        """
        pass


class BatchActionTypeFormat(object):
    """
    Batch action type format base class.
    """

    IO_NONE = 0
    IO_ONE = 1
    IO_MANY = 2

    def __init__(self):
        # name referred as a code, stored in format.type.
        self.name = ''

        # related group name
        self.group = None

        # i18n verbose name displayable for the client
        self.verbose_name = ''

        # list of related field into format.*.
        self.format_fields = ["type"]

        # batch action controller
        self._controller = None

        # has input batches
        self.input_type = BatchActionTypeFormat.IO_NONE

        # has output batches
        self.output_type = BatchActionTypeFormat.IO_ONE

    def validate(self, batch_action_type_format, value):
        """
        Validate the value according the format.
        :param batch_action_type_format: Format of the related batch action type
        :param value: Value to validate
        :return: None if the validation is done, else a string with the error detail
        """
        return None

    def check(self, batch_action_type_format):
        """
        Check the format of a descriptor type, if it is valid for a specific type of format.
        :param batch_action_type_format: Format of type of the related batch action type to check
        :return: None if the check is done, else a string with the error detail
        """
        return None

    def has_controller(self):
        return self._controller is not None

    def controller(self):
        """
        Return the associated batch controller.
        """
        return self._controller(self)


class BatchActionTypeFormatManager(object):
    """
    Singleton manager of set of batch action format types.
    """

    action_types = {}

    @classmethod
    def register(cls, batch_action_type_formats_list):
        """
        Register a list of batch action types.
        :param batch_action_type_formats_list: An array of batch action type
        """
        # register each type into a map
        for dft in batch_action_type_formats_list:
            if dft.name in cls.action_types:
                raise ImproperlyConfigured("Format of batch action type already defined (%s)" % dft.name)

            cls.action_types[dft.name] = dft

    @classmethod
    def values(cls):
        """
        Return the list of any registered batch action types format.
        """
        return list(cls.action_types.values())

    @classmethod
    def get(cls, batch_action_type_name):
        bat = cls.action_types.get(batch_action_type_name)
        if bat is None:
            raise ValueError("Unsupported format of batch action type %s" % action_format)

        return bat

    @classmethod
    def validate(cls, batch_action_type_format, value):
        """
        Call the validate of the correct descriptor format type.
        :param batch_action_type_format: Format of the type of batch action as python object
        :param value: Value to validate
        :except ValueError with descriptor of the problem
        """
        type_format = batch_action_type_format['type']

        bat = cls.action_types.get(type_format)
        if bat is None:
            raise ValueError("Unsupported format of batch action type %s" % type_format)

        res = bat.validate(type_format, value)
        if res is not None:
            raise ValueError(res)

    @classmethod
    def check(cls, batch_action_type_format):
        """
        Call the check of the correct descriptor format type.
        :param batch_action_type_format: Format of the type of descriptor as python object
        :return: True if check success.
        :except ValueError with descriptor of the problem
        """
        type_format = batch_action_type_format['type']

        bat = cls.action_types.get(type_format)
        if bat is None:
            raise ValueError("Unsupported format of batch action type %s" % type_format)

        data = batch_action_type_format.get('data')
        if data is None:
            raise ValueError("Missing batch action type data object")

        # according to its controller check the naming constants
        if bat.has_controller():
            constants = data.get('naming_options')
            if constants is None:
                raise ValueError("Missing name builder constants array")

            if len(constants) != bat.controller().name_builder.num_constants:
                raise ValueError("Number of name builder constants differs")

        res = bat.check(batch_action_type_format)
        if res is not None:
            raise ValueError(str(res))


class BatchActionFormatTypeGroupStandard(BatchActionTypeFormatGroup):
    """
    Group of standard values.
    """

    def __init__(self):
        super().__init__("standard", _("Standard"))


class BatchActionTypeFormatCreation(BatchActionTypeFormat):
    """
    Batch action format type for creation/introduction.
    - Input : None
    - Output : 1 or many created
    """

    def __init__(self):
        super().__init__()

        self.name = "creation"
        self.group = BatchActionFormatTypeGroupStandard()
        self.verbose_name = _("Creation")
        self.format_fields = ["type"]

        from accession.batchactions.creation import BatchActionCreation
        self._controller = BatchActionCreation

    def validate(self, batch_action_type_format, value):
        """
        Validate the value according the format.
        :param batch_action_type_format: Format of the related batch action type
        :param value: Value to validate
        :return: None if the validation is done, else a string with the error detail
        """
        return None

    def check(self, batch_action_type_format):
        """
        Check the format of a descriptor type, if it is valid for a specific type of format.
        :param batch_action_type_format: Format of type of the related batch action type to check
        :return: None if the check is done, else a string with the error detail
        """
        return None


class BatchActionTypeFormatMultiplication(BatchActionTypeFormat):
    """
    Batch action format type for multiplication.
    - Input : 1 or many
    - Output : 1 or many created
    """

    def __init__(self):
        super().__init__()

        self.name = "multiplication"
        self.group = BatchActionFormatTypeGroupStandard()
        self.verbose_name = _("Multiplication")
        self.format_fields = ["type"]

        from accession.batchactions.multiplication import BatchActionMultiplication
        self._controller = BatchActionMultiplication

    def validate(self, batch_action_type_format, value):
        """
        Validate the value according the format.
        :param batch_action_type_format: Format of the related batch action type
        :param value: Value to validate
        :return: None if the validation is done, else a string with the error detail
        """
        return None

    def check(self, batch_action_type_format):
        """
        Check the format of a descriptor type, if it is valid for a specific type of format.
        :param batch_action_type_format: Format of type of the related batch action type to check
        :return: None if the check is done, else a string with the error detail
        """
        return None


class BatchActionTypeFormatRegeneration(BatchActionTypeFormat):
    """
    Batch action format type for regeneration.
    - Input : 1 or many
    - Output : 1 or many created
    """

    def __init__(self):
        super().__init__()

        self.name = "regeneration"
        self.group = BatchActionFormatTypeGroupStandard()
        self.verbose_name = _("Regeneration")
        self.format_fields = ["type"]

    def validate(self, batch_action_type_format, value):
        """
        Validate the value according the format.
        :param batch_action_type_format: Format of the related batch action type
        :param value: Value to validate
        :return: None if the validation is done, else a string with the error detail
        """
        return None

    def check(self, batch_action_type_format):
        """
        Check the format of a descriptor type, if it is valid for a specific type of format.
        :param batch_action_type_format: Format of type of the related batch action type to check
        :return: None if the check is done, else a string with the error detail
        """
        return None


class BatchActionTypeFormatComplement(BatchActionTypeFormat):
    """
    Batch action format type for complement.
    - Input : 1 or many
    - Output : 1 or many modified
    """

    def __init__(self):
        super().__init__()

        self.name = "complement"
        self.group = BatchActionFormatTypeGroupStandard()
        self.verbose_name = _("Complement")
        self.format_fields = ["type"]

    def validate(self, batch_action_type_format, value):
        """
        Validate the value according the format.
        :param batch_action_type_format: Format of the related batch action type
        :param value: Value to validate
        :return: None if the validation is done, else a string with the error detail
        """
        return None

    def check(self, batch_action_type_format):
        """
        Check the format of a descriptor type, if it is valid for a specific type of format.
        :param batch_action_type_format: Format of type of the related batch action type to check
        :return: None if the check is done, else a string with the error detail
        """
        return None


class BatchActionTypeFormatSample(BatchActionTypeFormat):
    """
    Batch action format type for sample.
    - Input : 1 or many
    - Output : 1 or many modified
    """

    def __init__(self):
        super().__init__()

        self.name = "sample"
        self.group = BatchActionFormatTypeGroupStandard()
        self.verbose_name = _("Sample")
        self.format_fields = ["type"]

    def validate(self, batch_action_type_format, value):
        """
        Validate the value according the format.
        :param batch_action_type_format: Format of the related batch action type
        :param value: Value to validate
        :return: None if the validation is done, else a string with the error detail
        """
        return None

    def check(self, batch_action_type_format):
        """
        Check the format of a descriptor type, if it is valid for a specific type of format.
        :param batch_action_type_format: Format of type of the related batch action type to check
        :return: None if the check is done, else a string with the error detail
        """
        return None


class BatchActionTypeFormatSanitation(BatchActionTypeFormat):
    """
    Batch action format type for sample.
    - Input : 1 or many
    - Output : 1 or many modified
    """

    def __init__(self):
        super().__init__()

        self.name = "sanitation"
        self.group = BatchActionFormatTypeGroupStandard()
        self.verbose_name = _("Sanitation")
        self.format_fields = ["type"]

    def validate(self, batch_action_type_format, value):
        """
        Validate the value according the format.
        :param batch_action_type_format: Format of the related batch action type
        :param value: Value to validate
        :return: None if the validation is done, else a string with the error detail
        """
        return None

    def check(self, batch_action_type_format):
        """
        Check the format of a descriptor type, if it is valid for a specific type of format.
        :param batch_action_type_format: Format of type of the related batch action type to check
        :return: None if the check is done, else a string with the error detail
        """
        return None


class BatchActionTypeFormatCharacterization(BatchActionTypeFormat):
    """
    Batch action format type for characterization.
    - Input : 1 or many
    - Output : 1 or many modified
    """

    def __init__(self):
        super().__init__()

        self.name = "characterization"
        self.group = BatchActionFormatTypeGroupStandard()
        self.verbose_name = _("Characterization")
        self.format_fields = ["type"]

    def validate(self, batch_action_type_format, value):
        """
        Validate the value according the format.
        :param batch_action_type_format: Format of the related batch action type
        :param value: Value to validate
        :return: None if the validation is done, else a string with the error detail
        """
        return None

    def check(self, batch_action_type_format):
        """
        Check the format of a descriptor type, if it is valid for a specific type of format.
        :param batch_action_type_format: Format of type of the related batch action type to check
        :return: None if the check is done, else a string with the error detail
        """
        return None


class BatchActionTypeFormatConformityTest(BatchActionTypeFormat):
    """
    Batch action format type for characterization.
    - Input : 1 or many
    - Output : 1 or many modified
    """

    def __init__(self):
        super().__init__()

        self.name = "conformity_test"
        self.group = BatchActionFormatTypeGroupStandard()
        self.verbose_name = _("Conformity Test")
        self.format_fields = ["type"]

    def validate(self, batch_action_type_format, value):
        """
        Validate the value according the format.
        :param batch_action_type_format: Format of the related batch action type
        :param value: Value to validate
        :return: None if the validation is done, else a string with the error detail
        """
        return None

    def check(self, batch_action_type_format):
        """
        Check the format of a descriptor type, if it is valid for a specific type of format.
        :param batch_action_type_format: Format of type of the related batch action type to check
        :return: None if the check is done, else a string with the error detail
        """
        return None


class BatchActionTypeFormatElimination(BatchActionTypeFormat):
    """
    Batch action format type for characterization.
    - Input : 1 or many
    - Output : 1 or many archived
    """

    def __init__(self):
        super().__init__()

        self.name = "elimination"
        self.group = BatchActionFormatTypeGroupStandard()
        self.verbose_name = _("Elimination")
        self.format_fields = ["type"]

    def validate(self, batch_action_type_format, value):
        """
        Validate the value according the format.
        :param batch_action_type_format: Format of the related batch action type
        :param value: Value to validate
        :return: None if the validation is done, else a string with the error detail
        """
        return None

    def check(self, batch_action_type_format):
        """
        Check the format of a descriptor type, if it is valid for a specific type of format.
        :param batch_action_type_format: Format of type of the related batch action type to check
        :return: None if the check is done, else a string with the error detail
        """
        return None


class BatchActionTypeFormatDispatch(BatchActionTypeFormat):
    """
    Batch action format type for dispatch.
    - Input : 1 or many
    - Output : 1 or many archived
    """

    def __init__(self):
        super().__init__()

        self.name = "dispatch"
        self.group = BatchActionFormatTypeGroupStandard()
        self.verbose_name = _("Dispatch")
        self.format_fields = ["type"]

    def validate(self, batch_action_type_format, value):
        """
        Validate the value according the format.
        :param batch_action_type_format: Format of the related batch action type
        :param value: Value to validate
        :return: None if the validation is done, else a string with the error detail
        """
        return None

    def check(self, batch_action_type_format):
        """
        Check the format of a descriptor type, if it is valid for a specific type of format.
        :param batch_action_type_format: Format of type of the related batch action type to check
        :return: None if the check is done, else a string with the error detail
        """
        return None
