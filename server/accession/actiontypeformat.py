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

from accession.models import DescriptorMetaModel as Layout
from accession.namebuilder import NameBuilderManager


class ActionTypeFormatGroup(object):
    """
    Group of action type format.
    """

    def __init__(self, name, verbose_name):
        self.name = name
        self.verbose_name = verbose_name


class ActionController(object):
    """
    Action controller base class.
    It defines the interface to create or update the action, and to manage its related entities.
    """

    def __init__(self, action_type_format):
        self.type_format = action_type_format

    def naming_variables(self, accession_name, accession_code):
        return {
            'ACCESSION_NAME': accession_name,
            'ACCESSION_CODE': accession_code
        }

    def naming_constants(self, count, accession_naming_options, action_naming_options):
        constants = [""]*count

        # first retrieve constants from accession layout
        if accession_naming_options:
            i = 0
            for opt in accession_naming_options:
                constants[i] = opt
                i += 1

        # and override with action parameters
        if action_naming_options:
            i = 0
            for opt in action_naming_options:
                constants[i] = opt
                i += 1

        return constants

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

    def create(self, action_type, accession, user, input_batches=None):
        """
        Creation step of the action.
        :param action_type: Instance of the action type model
        :param accession: Related accession
        :param user: User actor of the creation
        :param input_batches: List of input batches or None if not necessary for the action
        :return The new batch action saved model
        """
        return None

    def update(self, action, user):
        """
        Update step of the batch action.
        :param action: A valid existing in DB action instance to be updated.
        :param user: User actor of this operation
        """
        pass


class ActionTypeFormat(object):
    """
    Action type format base class.
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

        # action controller
        self._controller = None

        # has input batches
        self.input_type = ActionTypeFormat.IO_NONE

        # has output batches
        self.output_type = ActionTypeFormat.IO_ONE

    def validate(self, action_type_format, value):
        """
        Validate the value according the format.
        :param action_type_format: Format of the related action type
        :param value: Value to validate
        :return: None if the validation is done, else a string with the error detail
        """
        return None

    def check(self, action_type_format):
        """
        Check the format of a descriptor type, if it is valid for a specific type of format.
        :param action_type_format: Format of type of the related action type to check
        :return: None if the check is done, else a string with the error detail
        """
        return None

    def has_controller(self):
        return self._controller is not None

    def controller(self):
        """
        Return the associated controller.
        """
        return self._controller(self)


class ActionTypeFormatManager(object):
    """
    Singleton manager of set of action format types.
    """

    action_types = {}

    @classmethod
    def register(cls, action_type_formats_list):
        """
        Register a list of action types.
        :param action_type_formats_list: An array of action type
        """
        # register each type into a map
        for dft in action_type_formats_list:
            if dft.name in cls.action_types:
                raise ImproperlyConfigured("Format of action type already defined (%s)" % dft.name)

            cls.action_types[dft.name] = dft

    @classmethod
    def values(cls):
        """
        Return the list of any registered action types format.
        """
        return list(cls.action_types.values())

    @classmethod
    def get(cls, action_type_name):
        bat = cls.action_types.get(action_type_name)
        if bat is None:
            raise ValueError("Unsupported format of action type %s" % action_type_name)

        return bat

    @classmethod
    def validate(cls, action_type_format, value):
        """
        Call the validate of the correct descriptor format type.
        :param action_type_format: Format of the type of action as python object
        :param value: Value to validate
        :except ValueError with descriptor of the problem
        """
        type_format = action_type_format['type']

        act = cls.action_types.get(type_format)
        if act is None:
            raise ValueError("Unsupported format of action type %s" % type_format)

        res = act.validate(type_format, value)
        if res is not None:
            raise ValueError(res)

    @classmethod
    def check(cls, action_type_format):
        """
        Call the check of the correct descriptor format type.
        :param action_type_format: Format of the type of descriptor as python object
        :return: True if check success.
        :except ValueError with descriptor of the problem
        """
        type_format = action_type_format['type']

        act = cls.action_types.get(type_format)
        if act is None:
            raise ValueError("Unsupported format of action type %s" % type_format)

        data = action_type_format.get('data')
        if data is None:
            raise ValueError("Missing action type data object")

        # according to its controller check the naming constants
        if act.has_controller():
            constants = data.get('naming_options')
            if constants is None:
                raise ValueError("Missing name builder constants array")

            if len(constants) != act.controller().name_builder.num_constants:
                raise ValueError("Number of name builder constants differs")

        res = act.check(action_type_format)
        if res is not None:
            raise ValueError(str(res))


class ActionFormatTypeGroupStandard(ActionTypeFormatGroup):
    """
    Group of standard values.
    """

    def __init__(self):
        super().__init__("standard", _("Standard"))


class ActionTypeFormatCreation(ActionTypeFormat):
    """
    Action format type for creation/introduction.
    - Input : None
    - Output : 1 or many created
    """

    def __init__(self):
        super().__init__()

        self.name = "creation"
        self.group = ActionFormatTypeGroupStandard()
        self.verbose_name = _("Creation")
        self.format_fields = ["type"]

        from accession.actions.creation import ActionCreation
        self._controller = ActionCreation

    def validate(self, action_type_format, value):
        """
        Validate the value according the format.
        :param action_type_format: Format of the related action type
        :param value: Value to validate
        :return: None if the validation is done, else a string with the error detail
        """
        return None

    def check(self, action_type_format):
        """
        Check the format of a descriptor type, if it is valid for a specific type of format.
        :param action_type_format: Format of type of the related action type to check
        :return: None if the check is done, else a string with the error detail
        """
        return None


class ActionTypeFormatMultiplication(ActionTypeFormat):
    """
    Action format type for multiplication.
    - Input : 1 or many
    - Output : 1 or many created
    """

    def __init__(self):
        super().__init__()

        self.name = "multiplication"
        self.group = ActionFormatTypeGroupStandard()
        self.verbose_name = _("Multiplication")
        self.format_fields = ["type"]

        from accession.actions.multiplication import ActionMultiplication
        self._controller = ActionMultiplication

    def validate(self, action_type_format, value):
        """
        Validate the value according the format.
        :param action_type_format: Format of the related action type
        :param value: Value to validate
        :return: None if the validation is done, else a string with the error detail
        """
        return None

    def check(self, action_type_format):
        """
        Check the format of a descriptor type, if it is valid for a specific type of format.
        :param action_type_format: Format of type of the related action type to check
        :return: None if the check is done, else a string with the error detail
        """
        return None


class ActionTypeFormatRegeneration(ActionTypeFormat):
    """
    Action format type for regeneration.
    - Input : 1 or many
    - Output : 1 or many created
    """

    def __init__(self):
        super().__init__()

        self.name = "regeneration"
        self.group = ActionFormatTypeGroupStandard()
        self.verbose_name = _("Regeneration")
        self.format_fields = ["type"]

    def validate(self, action_type_format, value):
        """
        Validate the value according the format.
        :param action_type_format: Format of the related action type
        :param value: Value to validate
        :return: None if the validation is done, else a string with the error detail
        """
        return None

    def check(self, action_type_format):
        """
        Check the format of a descriptor type, if it is valid for a specific type of format.
        :param action_type_format: Format of type of the related action type to check
        :return: None if the check is done, else a string with the error detail
        """
        return None


class ActionTypeFormatComplement(ActionTypeFormat):
    """
    Action format type for complement.
    - Input : 1 or many
    - Output : 1 or many modified
    """

    def __init__(self):
        super().__init__()

        self.name = "complement"
        self.group = ActionFormatTypeGroupStandard()
        self.verbose_name = _("Complement")
        self.format_fields = ["type"]

    def validate(self, action_type_format, value):
        """
        Validate the value according the format.
        :param action_type_format: Format of the related action type
        :param value: Value to validate
        :return: None if the validation is done, else a string with the error detail
        """
        return None

    def check(self, action_type_format):
        """
        Check the format of a descriptor type, if it is valid for a specific type of format.
        :param action_type_format: Format of type of the related action type to check
        :return: None if the check is done, else a string with the error detail
        """
        return None


class ActionTypeFormatSample(ActionTypeFormat):
    """
    Action format type for sample.
    - Input : 1 or many
    - Output : 1 or many modified
    """

    def __init__(self):
        super().__init__()

        self.name = "sample"
        self.group = ActionFormatTypeGroupStandard()
        self.verbose_name = _("Sample")
        self.format_fields = ["type"]

    def validate(self, action_type_format, value):
        """
        Validate the value according the format.
        :param action_type_format: Format of the related action type
        :param value: Value to validate
        :return: None if the validation is done, else a string with the error detail
        """
        return None

    def check(self, action_type_format):
        """
        Check the format of a descriptor type, if it is valid for a specific type of format.
        :param action_type_format: Format of type of the related action type to check
        :return: None if the check is done, else a string with the error detail
        """
        return None


class ActionTypeFormatSanitation(ActionTypeFormat):
    """
    Action format type for sample.
    - Input : 1 or many
    - Output : 1 or many modified
    """

    def __init__(self):
        super().__init__()

        self.name = "sanitation"
        self.group = ActionFormatTypeGroupStandard()
        self.verbose_name = _("Sanitation")
        self.format_fields = ["type"]

    def validate(self, action_type_format, value):
        """
        Validate the value according the format.
        :param action_type_format: Format of the related action type
        :param value: Value to validate
        :return: None if the validation is done, else a string with the error detail
        """
        return None

    def check(self, action_type_format):
        """
        Check the format of a descriptor type, if it is valid for a specific type of format.
        :param action_type_format: Format of type of the related action type to check
        :return: None if the check is done, else a string with the error detail
        """
        return None


class ActionTypeFormatCharacterization(ActionTypeFormat):
    """
    Action format type for characterization.
    - Input : 1 or many
    - Output : 1 or many modified
    """

    def __init__(self):
        super().__init__()

        self.name = "characterization"
        self.group = ActionFormatTypeGroupStandard()
        self.verbose_name = _("Characterization")
        self.format_fields = ["type"]

    def validate(self, action_type_format, value):
        """
        Validate the value according the format.
        :param action_type_format: Format of the related action type
        :param value: Value to validate
        :return: None if the validation is done, else a string with the error detail
        """
        return None

    def check(self, action_type_format):
        """
        Check the format of a descriptor type, if it is valid for a specific type of format.
        :param action_type_format: Format of type of the related action type to check
        :return: None if the check is done, else a string with the error detail
        """
        return None


class ActionTypeFormatConformityTest(ActionTypeFormat):
    """
    Action format type for characterization.
    - Input : 1 or many
    - Output : 1 or many modified
    """

    def __init__(self):
        super().__init__()

        self.name = "conformity_test"
        self.group = ActionFormatTypeGroupStandard()
        self.verbose_name = _("Conformity Test")
        self.format_fields = ["type"]

    def validate(self, action_type_format, value):
        """
        Validate the value according the format.
        :param action_type_format: Format of the related action type
        :param value: Value to validate
        :return: None if the validation is done, else a string with the error detail
        """
        return None

    def check(self, action_type_format):
        """
        Check the format of a descriptor type, if it is valid for a specific type of format.
        :param action_type_format: Format of type of the related action type to check
        :return: None if the check is done, else a string with the error detail
        """
        return None


class ActionTypeFormatElimination(ActionTypeFormat):
    """
    Action format type for characterization.
    - Input : 1 or many
    - Output : 1 or many archived
    """

    def __init__(self):
        super().__init__()

        self.name = "elimination"
        self.group = ActionFormatTypeGroupStandard()
        self.verbose_name = _("Elimination")
        self.format_fields = ["type"]

    def validate(self, action_type_format, value):
        """
        Validate the value according the format.
        :param action_type_format: Format of the related action type
        :param value: Value to validate
        :return: None if the validation is done, else a string with the error detail
        """
        return None

    def check(self, action_type_format):
        """
        Check the format of a descriptor type, if it is valid for a specific type of format.
        :param action_type_format: Format of type of the related action type to check
        :return: None if the check is done, else a string with the error detail
        """
        return None


class ActionTypeFormatDispatch(ActionTypeFormat):
    """
    Action format type for dispatch.
    - Input : 1 or many
    - Output : 1 or many archived
    """

    def __init__(self):
        super().__init__()

        self.name = "dispatch"
        self.group = ActionFormatTypeGroupStandard()
        self.verbose_name = _("Dispatch")
        self.format_fields = ["type"]

    def validate(self, action_type_format, value):
        """
        Validate the value according the format.
        :param action_type_format: Format of the related action type
        :param value: Value to validate
        :return: None if the validation is done, else a string with the error detail
        """
        return None

    def check(self, action_type_format):
        """
        Check the format of a descriptor type, if it is valid for a specific type of format.
        :param action_type_format: Format of type of the related action type to check
        :return: None if the check is done, else a string with the error detail
        """
        return None
