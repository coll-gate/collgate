# -*- coding: utf-8; -*-
#
# Copyright (c) 2017 INRA UMR1095 GDEC

"""
coll-gate medialibrary models.
"""

from django.db import models
from django.utils.translation import ugettext_lazy as _

from main.models import Entity


class MediaCollection(Entity):
    """
    Defines a collection of media.
    """

    class Meta:
        verbose_name = _("media collection")


class Media(Entity):
    """
    Defines a file contained by the local file system.
    Name contains the local file path + name that is unique.
    """

    # upload version number
    version = models.PositiveIntegerField(default=0)

    # initial uploaded file name with some specials characters replaced by '_'
    # to prevent forbidden characters with commons OS.
    file_name = models.CharField(max_length=256)

    # mime type of the media (image, pdf...)
    mime_type = models.CharField(max_length=64)

    # file size in bytes
    file_size = models.PositiveIntegerField(default=0)

    # can belong to a collection
    collection = models.ForeignKey('MediaCollection', related_name='medias')

    class Meta:
        verbose_name = _("media")
