# -*- coding: utf-8; -*-
#
# @file models.py
# @brief coll-gate medialibrary models.
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2017-01-03
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

import json

from django.contrib.contenttypes.models import ContentType
from django.contrib.postgres.fields import JSONField
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

    # Document label.
    # It is i18nized used JSON dict with language code as key and label as string value.
    label = JSONField(default={})

    # general description (JSON stored dict with multiple languages codes)
    description = JSONField(default={})

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
        Get the label in the current regional.
        """
        lang = translation.get_language()
        return self.label.get(lang, "")

    def set_label(self, lang, label):
        """
        Set the label for a specific language.
        :param str lang: language code string
        :param str label: Localized label
        :note Model instance save() is not called.
        """
        self.label[lang] = label

    def get_description(self):
        """
        Get the label for this panel in the current regional.
        """
        lang = translation.get_language()

        return self.description.get(lang, "")

    @classmethod
    def make_search_by_name(cls, term):
        return Q(name__istartswith=term) | Q(file_name__istartswith=term)
