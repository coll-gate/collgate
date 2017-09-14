# -*- coding: utf-8; -*-
#
# @file descriptormetamodeltype.py
# @brief coll-gate descriptor meta-model format type class
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2017-09-13
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details

from django.core.exceptions import ImproperlyConfigured


class DescriptorMetaModelType(object):
    """
    Descriptor meta-model type class model.
    """

    def __init__(self):
        # related entity model class. unique per model.
        self.model = None

        # i18n verbose name displayable for the client
        self.verbose_name = ''

        # list of related field into parameters.*.
        self.parameters_fields = []

    def check(self, data):
        """
        Check the format of a descriptor type, if it is valid for a specific type.
        :param data: Data of type or format of descriptor meta-model to check
        :return: None if the check is done, else a string with the error detail
        """
        return None


class   DescriptorMetaModelTypeManager(object):
    """
    Singleton manager of set of descriptor meta-model format type.
    """

    descriptor_meta_model_format_types = {}

    @classmethod
    def register(cls, format_types_list):
        """
        Register a list of descriptor meta-model type.
        :param format_types_list: An array of descriptor meta-model type.
        """
        # register each type into a map
        for dmm_ft in format_types_list:
            if dmm_ft.model in cls.descriptor_meta_model_format_types:
                raise ImproperlyConfigured("Descriptor meta-model format type not already defined (%s)" % str(dmm_ft.model._meta.verbose_name))

            cls.descriptor_meta_model_format_types[dmm_ft.model] = dmm_ft

    @classmethod
    def values(cls):
        """
        Return the list of any registered descriptor meta-model types.
        """
        return list(cls.descriptor_meta_model_format_types.values())

    @classmethod
    def has(cls, model):
        return model in cls.descriptor_meta_model_format_types

    @classmethod
    def get(cls, model):
        dmm_ft = cls.descriptor_meta_model_format_types.get(model)
        if dmm_ft is None:
            raise ValueError("Unsupported descriptor meta-model type %s" % model)

        return dmm_ft

    @classmethod
    def check(cls, model, data):
        """
        Call the check of the correct descriptor meta-model type.
        :param model: Model of type or format of descriptor meta-model to check with
        :param data: Data of type or format of descriptor meta-model to check
        :return: True if check success.
        :except ValueError with descriptor of the problem
        """
        dmm_ft = cls.descriptor_meta_model_format_types.get(model)
        if dmm_ft is None:
            raise ValueError("Unsupported descriptor meta-model type %s" % str(model._meta.verbose_name))

        res = dmm_ft.check(data)
        if res is not None:
            raise ValueError(str(res))
