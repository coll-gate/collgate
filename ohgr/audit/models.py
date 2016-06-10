# -*- coding: utf-8; -*-
#
# Copyright (c) 2014 INRA UMR1095 GDEC

"""
ohgr application models.
"""
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.contrib.auth.models import User
from django.utils.translation import ugettext_lazy as _

from igdectk.common.models import ChoiceEnum, IntegerChoice, StringChoice




class Audit(models.Model):
    """
    Trace some actions (CRUD on models, and actions for process).
    To trace on a process you must use the main.models.Action model
    as content type, and to register the action into the DB.
    """

    user = models.ForeignKey(User, null=False, blank=False)
    content_type = models.ForeignKey(ContentType, null=False, blank=False)
    object_id = models.IntegerField()

    timestamp = models.DateTimeField(auto_now_add=True)
    # details =
