# -*- coding: utf-8; -*-
#
# Copyright (c) 2017 INRA UMR1095 GDEC

"""
coll-gate descriptor format type class for media library
"""
import os
import re
import validictory

from django.utils.translation import ugettext_lazy as _

from descriptor.descriptorformattype import DescriptorFormatType, DescriptorFormatTypeGroup
from medialibrary import localsettings
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
        self.external = True

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

    def own(self, entity, old_value, new_value):
        # compare
        if old_value == new_value:
            return

        # delete old
        if old_value is not None:
            try:
                old_media = Media.objects.get(uuid=old_value)
            except Media.DoesNotExist:
                return _("The descriptor old_value must refers to an existing media")

            # delete the related file
            abs_filename = os.path.join(localsettings.storage_path, old_media.name)

            if os.path.exists(abs_filename):
                os.remove(abs_filename)

            # and the model
            old_media.delete()

        # associate new
        if new_value is not None:
            try:
                new_media = Media.objects.get(uuid=new_value)
            except Media.DoesNotExist:
                return _("The descriptor new_value must refers to an existing media")

            new_media.owner_content_type = entity.content_type
            new_media.owner_object_id = entity.pk

            new_media.save()


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
        self.external = True

    def validate(self, descriptor_type_format, value, descriptor_model_type):
        # check if the value is a string and if the related entity exists
        if not isinstance(value, list):
            return _("The descriptor value must be an array of string")

        # check max items number
        if len(value) > descriptor_type_format['max_items']:
            return _("The number of media must be lesser or equal than %i" % descriptor_type_format['max_items'])

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

    def own(self, entity, old_value, new_value):
        # as set to simplify comparisons
        old_values = set(old_value) if old_value is not None else set()
        new_values = set(new_value) if new_value is not None else set()

        # compare
        if old_values == new_values:
            return

        # delete un-kept old
        for value in old_values - new_values:
            if value is not None:
                try:
                    old_media = Media.objects.get(uuid=value)
                except Media.DoesNotExist:
                    return _("The descriptor old_value must refers to an existing media")

                # delete the related file
                abs_filename = os.path.join(localsettings.storage_path, old_media.name)

                if os.path.exists(abs_filename):
                    os.remove(abs_filename)

                # and the model
                old_media.delete()

        # associate new
        for value in new_values - old_values:
            if value is not None:
                try:
                    new_media = Media.objects.get(uuid=value)
                except Media.DoesNotExist:
                    return _("The descriptor new_value must refers to an existing media")

                new_media.owner_content_type = entity.content_type
                new_media.owner_object_id = entity.pk

                new_media.save()

    def get_display_values_for(self, descriptor_type, descriptor_type_format, values, limit):
        items = {}

        # search for the media
        # @todo

        return {
            'cacheable': True,
            'items': items
        }
