# -*- coding: utf-8; -*-
#
# Copyright (c) 2014 INRA UMR1095 GDEC

"""
ohgr application models.
"""
from django.db import models
from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType
from django.utils.translation import ugettext_lazy as _

from igdectk.common.models import ChoiceEnum, IntegerChoice, StringChoice


class Profile(models.Model):

    STATE_CREATED = 0
    STATE_INITIALISED = 1
    STATE_INFORMED = 2
    STATE_VERIFIED = 3
    STATE_CLOSED = 4

    PROFILE_STATES = (
        (0, STATE_CREATED),
        (1, STATE_INITIALISED),
        (2, STATE_INFORMED),
        (3, STATE_VERIFIED),
        (4, STATE_CLOSED)
    )

    user = models.ForeignKey(User, null=False, blank=False)
    state = models.IntegerField(default=STATE_CREATED, choices=PROFILE_STATES)
    company = models.CharField(max_length=127)
    admin_status = models.CharField(max_length=512)


class Settings(models.Model):

    param_name = models.CharField(max_length=127)
    value = models.CharField(max_length=127)


class Languages(ChoiceEnum):
    """
    Static for purposes.
    """

    EN = StringChoice('en', _('English'))
    FR = StringChoice('fr', _('French'))


class Action(models.Model):
    """
    An action defines a process of changes (suite of CRUD operations).
    It is related to the ContentType model and refers to many others
    ContentType.
    It is used to describes a process that refers changes to more than
    a single object.
    It is also related by the permissions manager, and by the audit mechanism.
    """
    app_label = models.CharField(max_length=100)
    codename = models.CharField(max_length=100)

    models = models.ManyToManyField(ContentType)

    class Meta:
        index_together = (("app_label", "codename"), )
        unique_together = (("app_label", "codename"),)

        default_permissions = list()
