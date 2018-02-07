# -*- coding: utf-8; -*-
#
# @file layouttype.py
# @brief coll-gate descriptor layout format type class
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2017-09-13
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details

from django.core.exceptions import ImproperlyConfigured


class LayoutType(object):
    """
    Descriptor layout type class model.
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
        :param data: Data of type or format of descriptor layout to check
        :return: None if the check is done, else a string with the error detail
        """
        return None


class LayoutTypeManager(object):
    """
    Singleton manager of set of descriptor layout format type.
    """

    layout_format_types = {}

    @classmethod
    def register(cls, format_types_list):
        """
        Register a list of descriptor layout type.
        :param format_types_list: An array of descriptor layout type.
        """
        # register each type into a map
        for layout_ft in format_types_list:
            if layout_ft.model in cls.layout_format_types:
                raise ImproperlyConfigured(
                    "Descriptor layout format type not already defined (%s)" % str(layout_ft.model._meta.verbose_name))

            cls.layout_format_types[layout_ft.model] = layout_ft

    @classmethod
    def values(cls):
        """
        Return the list of any registered descriptor layout types.
        """
        return list(cls.layout_format_types.values())

    @classmethod
    def has(cls, model):
        return model in cls.layout_format_types

    @classmethod
    def get(cls, model):
        layout_ft = cls.layout_format_types.get(model)
        if layout_ft is None:
            raise ValueError("Unsupported descriptor layout type %s" % model)

        return layout_ft

    @classmethod
    def check(cls, model, data):
        """
        Call the check of the correct descriptor layout type.
        :param model: Model of type or format of descriptor layout to check with
        :param data: Data of type or format of descriptor layout to check
        :return: True if check success.
        :except ValueError with descriptor of the problem
        """
        layout_ft = cls.layout_format_types.get(model)
        if layout_ft is None:
            raise ValueError("Unsupported descriptor layout type %s" % str(model._meta.verbose_name))

        res = layout_ft.check(data)
        if res is not None:
            raise ValueError(str(res))
