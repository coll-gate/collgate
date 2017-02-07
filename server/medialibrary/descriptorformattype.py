# -*- coding: utf-8; -*-
#
# Copyright (c) 2017 INRA UMR1095 GDEC

"""
coll-gate descriptor format type class for media library
"""

import validictory

from django.utils.translation import ugettext_lazy as _

from descriptor.descriptorformattype import DescriptorFormatType, DescriptorFormatTypeGroup


class DescriptorFormatTypeGroupMedia(DescriptorFormatTypeGroup):
    """
    Group of media descriptors.
    """

    def __init__(self):
        super().__init__("media", _("Media"))


class DescriptorFormatTypeMedia(DescriptorFormatType):
    """
    Specialisation for a media value.
    """

    def __init__(self):
        super().__init__()

        self.name = "media"
        self.group = DescriptorFormatTypeGroupMedia()
        self.verbose_name = _("Media")
        self.format_fields = ["media_types", "media_inline"]

    def validate(self, descriptor_type_format, value, descriptor_model_type):
        # check if the value is an integer and if the related entity exists
        if not isinstance(value, int):
            return _("The descriptor value must be an integer")

        # check if the entity exists @todo
        # try:
        #     app_label, model = descriptor_type_format['model'].split('.')
        #     content_type = get_object_or_404(ContentType, app_label=app_label, model=model)
        #     content_type.get_object_for_this_type(id=value)
        # except ObjectDoesNotExist:
        #     return _("The descriptor value must refers to an existing media")

        return None

    def check(self, descriptor_type_format):
        schema = {
            "type": "object",
            "properties": {
                "media_types": {"type": "array", 'minLength': 1, 'maxLength': 16},
                "media_inline": {"type": "boolean"}
            }
        }

        try:
            validictory.validate(descriptor_type_format, schema)
        except validictory.MultipleValidationError as e:
            return str(e)

        for media_type in descriptor_type_format["media_types"]:
            if media_type not in ['archives', 'images', 'documents', 'spreadsheets']:
                return _("Media type must be archives, images, documents or spreadsheets (media_types)")

        return None


class DescriptorFormatTypeMediaCollection(DescriptorFormatType):
    """
    Specialisation for a media collection value.
    """

    def __init__(self):
        super().__init__()

        self.name = "media_collection"
        self.group = DescriptorFormatTypeGroupMedia()
        self.verbose_name = _("Media collection")
        self.format_fields = ["media_types", "max_items", "media_inline"]

    def validate(self, descriptor_type_format, value, descriptor_model_type):
        # check if the value is an integer and if the related entity exists
        if not isinstance(value, int):
            return _("The descriptor value must be an integer")

        # check if the media collection exists @todo
        # try:
        #     app_label, model = descriptor_type_format['model'].split('.')
        #     content_type = get_object_or_404(ContentType, app_label=app_label, model=model)
        #     content_type.get_object_for_this_type(id=value)
        # except ObjectDoesNotExist:
        #     return _("The descriptor value must refers to an existing collection of media")

        return None

    def check(self, descriptor_type_format):
        schema = {
            "type": "object",
            "properties": {
                "media_types": {"type": "array", 'minLength': 1, 'maxLength': 16},
                "max_items": {"type": "integer", 'minimum': 2, 'maximum': 256},
                "media_inline": {"type": "boolean"}
            }
        }

        try:
            validictory.validate(descriptor_type_format, schema)
        except validictory.MultipleValidationError as e:
            return str(e)

        for media_type in descriptor_type_format["media_types"]:
            if media_type not in ['archives', 'images', 'documents', 'spreadsheets']:
                return _("Media type must be archives, images, documents or spreadsheets (media_types)")

        return None
