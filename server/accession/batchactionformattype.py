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


class BatchActionFormatType(object):
    """
    Batch action format type base class.
    """

    def __init__(self):
        # name referred as a code, stored in format.type.
        self.name = ''

        # i18n verbose name displayable for the client
        self.verbose_name = ''

        # list of related field into format.*.
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


class BatchActionFormatTypeManager(object):
    """
    Singleton manager of set of batch action format types.
    """

    action_types = {}

    @classmethod
    def register(cls, batch_action_types_list):
        """
        Register a list of batch action types.
        :param batch_action_types_list: An array of batch action type
        """
        # register each type into a map
        for dft in batch_action_types_list:
            if dft.name in cls.action_types:
                raise ImproperlyConfigured("Batch action type already defined (%s)" % dft.name)

            cls.action_types[dft.name] = dft

    @classmethod
    def values(cls):
        """
        Return the list of any registered batch action types .
        """
        return list(cls.action_types.values())

    @classmethod
    def get(cls, batch_action_type_format):
        format_type = batch_action_type_format['type']

        dft = cls.action_types.get(format_type)
        if dft is None:
            raise ValueError("Unsupported batch action type %s" % format_type)

        return dft

    @classmethod
    def validate(cls, batch_action_type_format, value):
        """
        Call the validate of the correct descriptor format type.
        :param batch_action_type_format: Format of the type of batch action as python object
        :param value: Value to validate
        :except ValueError with descriptor of the problem
        """
        format_type = batch_action_type_format['type']

        dft = cls.action_types.get(format_type)
        if dft is None:
            raise ValueError("Unsupported batch action type %s" % format_type)

        res = dft.validate(format_type, value)
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
        format_type = batch_action_type_format['type']

        dft = cls.action_types.get(format_type)
        if dft is None:
            raise ValueError("Unsupported batch action type %s" % format_type)

        res = dft.check(batch_action_type_format)
        if res is not None:
            raise ValueError(str(res))


class BatchActionFormatTypeCreation(object):
    """
    Batch action format type for creation/introduction.
    - Input : None
    - Output : 1 or many created
    """

    def __init__(self):
        # name referred as a code, stored in format.type.
        self.name = "creation"

        # i18n verbose name displayable for the client
        self.verbose_name = _("Creation")

        # list of related field into format.*.
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


class BatchActionFormatTypeMultiplication(object):
    """
    Batch action format type for multiplication.
    - Input : 1 or many
    - Output : 1 or many created
    """

    def __init__(self):
        # name referred as a code, stored in format.type.
        self.name = 'multiplication'

        # i18n verbose name displayable for the client
        self.verbose_name = _("Multiplication")

        # list of related field into format.*.
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


class BatchActionFormatTypeRegeneration(object):
    """
    Batch action format type for regeneration.
    - Input : 1 or many
    - Output : 1 or many created
    """

    def __init__(self):
        # name referred as a code, stored in format.type.
        self.name = 'regeneration'

        # i18n verbose name displayable for the client
        self.verbose_name = _("Regeneration")

        # list of related field into format.*.
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


class BatchActionFormatTypeComplement(object):
    """
    Batch action format type for complement.
    - Input : 1 or many
    - Output : 1 or many modified
    """

    def __init__(self):
        # name referred as a code, stored in format.type.
        self.name = 'complement'

        # i18n verbose name displayable for the client
        self.verbose_name = _("Complement")

        # list of related field into format.*.
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


class BatchActionFormatTypeSample(object):
    """
    Batch action format type for sample.
    - Input : 1 or many
    - Output : 1 or many modified
    """

    def __init__(self):
        # name referred as a code, stored in format.type.
        self.name = 'sample'

        # i18n verbose name displayable for the client
        self.verbose_name = _("Sample")

        # list of related field into format.*.
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


class BatchActionFormatTypeSanitation(object):
    """
    Batch action format type for sample.
    - Input : 1 or many
    - Output : 1 or many modified
    """

    def __init__(self):
        # name referred as a code, stored in format.type.
        self.name = 'sanitation'

        # i18n verbose name displayable for the client
        self.verbose_name = _("Sanitation")

        # list of related field into format.*.
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


class BatchActionFormatTypeCharacterization(object):
    """
    Batch action format type for characterization.
    - Input : 1 or many
    - Output : 1 or many modified
    """

    def __init__(self):
        # name referred as a code, stored in format.type.
        self.name = 'characterization'

        # i18n verbose name displayable for the client
        self.verbose_name = _("Characterization")

        # list of related field into format.*.
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


class BatchActionFormatTypeConformityTest(object):
    """
    Batch action format type for characterization.
    - Input : 1 or many
    - Output : 1 or many modified
    """

    def __init__(self):
        # name referred as a code, stored in format.type.
        self.name = 'conformity-test'

        # i18n verbose name displayable for the client
        self.verbose_name = _("Conformity Test")

        # list of related field into format.*.
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


class BatchActionFormatTypeElimination(object):
    """
    Batch action format type for characterization.
    - Input : 1 or many
    - Output : 1 or many archived
    """

    def __init__(self):
        # name referred as a code, stored in format.type.
        self.name = 'elimination'

        # i18n verbose name displayable for the client
        self.verbose_name = _("Elimination")

        # list of related field into format.*.
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
