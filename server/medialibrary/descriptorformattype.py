# -*- coding: utf-8; -*-
#
# Copyright (c) 2017 INRA UMR1095 GDEC

"""
coll-gate descriptor format type class for media library
"""

from django.utils.translation import ugettext_lazy as _

from descriptor.descriptorformattype import DescriptorFormatTypeGroupSingle, DescriptorFormatType, DescriptorFormatTypeGroup


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
        self.format_fields = [
            "media_types",
        ]

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
        if "media_types" not in descriptor_type_format:
            return _("Missing media types (media_types)")

        if len(descriptor_type_format["media_types"]) > 16:
            return _("Media types array length must not exceed 16 (media_types)")

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
        self.format_fields = [
            "media_types",
            "max_items"
        ]

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
        if "media_types" not in descriptor_type_format:
            return _("Missing media types (media_types)")

        if len(descriptor_type_format["media_types"]) > 16:
            return _("Media types array length must not exceed 16 (media_types)")

        if "max_items" not in descriptor_type_format:
            return _("Missing number of max items (max_items)")

        if descriptor_type_format["max_items"] < 2 or descriptor_type_format["max_items"] > 256:
            return _("Max items number must be between 2 and 256 (max_items)")

        return None
