# -*- coding: utf-8; -*-
#
# Copyright (c) 2017 INRA UMR1095 GDEC

"""
coll-gate medialibrary models.
"""

from django.db import models

from main.models import Entity


class Media(Entity):
    """
    Defines a file contained by the local file system.
    The upload file name is contained by name and it is syntactically OS independent.
    """

    # file path + file name from the storage location directory
    file = models.CharField(max_length=1024, null=True)

    # mime type of the media (image, pdf...)
    mime_type = models.CharField(max_length=64)

    # file size in bytes
    file_size = models.PositiveIntegerField(default=0)
