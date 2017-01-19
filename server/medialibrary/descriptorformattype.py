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
            self.error = _("The descriptor value must be an integer")
            return False

        # check if the entity exists @todo
        # try:
        #     app_label, model = descriptor_type_format['model'].split('.')
        #     content_type = get_object_or_404(ContentType, app_label=app_label, model=model)
        #     content_type.get_object_for_this_type(id=value)
        # except ObjectDoesNotExist:
        #     self.error = _("The descriptor value must refers to an existing media")
        #     return False

        return True


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
            self.error = _("The descriptor value must be an integer")
            return False

        # check if the media collection exists @todo
        # try:
        #     app_label, model = descriptor_type_format['model'].split('.')
        #     content_type = get_object_or_404(ContentType, app_label=app_label, model=model)
        #     content_type.get_object_for_this_type(id=value)
        # except ObjectDoesNotExist:
        #     self.error = _("The descriptor value must refers to an existing collection of media")
        #     return False

        return True
