# -*- coding: utf-8; -*-
#
# Copyright (c) 2017 INRA UMR1095 GDEC

"""
coll-gate descriptor format type class for media library
"""

import re
import validictory

from django.utils.translation import ugettext_lazy as _

from descriptor.descriptorformattype import DescriptorFormatType, DescriptorFormatTypeGroup
from medialibrary.models import Media

RE_UUID = re.compile(r'^[a-zA-Z0-9]{8}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{12}$')


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
        self.relation = True

    def validate(self, descriptor_type_format, value, descriptor_model_type):
        # check if the value is a string and if the related entity exists
        if not isinstance(value, str):
            return _("The descriptor value must be a string")

        # regexp on uuid
        if RE_UUID.match(value) is None:
            return _("The descriptor value must match with the UUID format")

        # check if the media exists
        try:
            media = Media.objects.get(uuid=value)
        except Media.DoesNotExist:
            return _("The descriptor value must refers to an existing media")

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

    def relate(self, entity, value):
        """
        Associate or dissociate two entities. One is the entity that contains descriptors,
        the other is targeted by its value.
        :param entity: Master (left) entity of the association
        :param value: Target (right) entity of the association
        """
        pass


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
        self.relation = True

    def validate(self, descriptor_type_format, value, descriptor_model_type):
        # check if the value is a string and if the related entity exists
        if not isinstance(value, list):
            return _("The descriptor value must be an array of string")

        # check max items number
        if len(value) > descriptor_type_format['max_items']:
            return _("The number of medias must be lesser or equal than %i" % descriptor_type_format['max_items'])

        # regexp on uuid
        for val in value:
            if RE_UUID.match(val) is None:
                return _("The descriptor value must match with the UUID format")

        # check if the media exists
        medias = Media.objects.filter(uuid__in=value)
        if medias.count() != len(value):
            return _("The descriptor value must refers to an existing media")

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
