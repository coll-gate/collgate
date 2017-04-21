# -*- coding: utf-8; -*-
#
# @file models.py
# @brief 
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2017-01-03
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

"""
coll-gate medialibrary models.
"""
import json

from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.db.models import Q
from django.utils import translation
from django.utils.translation import ugettext_lazy as _

from main.models import Entity


class Media(Entity):
    """
    Defines a file contained by the local file system.
    Name contains the local file path + name that is unique.
    """

    # unique name of media
    name = models.CharField(unique=True, max_length=255, db_index=True)

    # content type of the owner
    owner_content_type = models.ForeignKey(ContentType, related_name='+')

    # object id of the owner related to the content type
    owner_object_id = models.IntegerField()

    # upload version number
    version = models.PositiveIntegerField(default=0)

    # initial uploaded file name with some specials characters replaced by '_'
    # to prevent forbidden characters with commons OS.
    file_name = models.CharField(max_length=256)

    # mime type of the media (image, pdf...)
    mime_type = models.CharField(max_length=64)

    # file size in bytes
    file_size = models.PositiveIntegerField(default=0)

    # document label (JSON stored dict with multiple languages codes)
    label = models.TextField(default="{}", blank=False, null=False)

    # general description (JSON stored dict with multiple languages codes)
    description = models.TextField(default="{}", blank=False, null=False)

    # copyright text (organisation, authors names...)
    copyright = models.CharField(max_length=1024, default="", blank=True)

    # year of the document (mostly photo taken year)
    year = models.IntegerField(null=True, default=None)

    class Meta:
        verbose_name = _("media")

    def natural_name(self):
        return self.name

    def get_label(self):
        """
        Get the label for this panel in the current regional.
        """
        data = json.loads(self.label)
        lang = translation.get_language()

        return data.get(lang, "")

    def get_description(self):
        """
        Get the label for this panel in the current regional.
        """
        data = json.loads(self.description)
        lang = translation.get_language()

        return data.get(lang, "")

    @classmethod
    def make_search_by_name(cls, term):
        return Q(name__istartswith=term) | Q(file_name__istartswith=term)

