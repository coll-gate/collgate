# -*- coding: utf-8; -*-
#
# Copyright (c) 2014 INRA UMR1095 GDEC

"""
coll-gate application models.
"""
import uuid as uuid

from django.db import models
from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType
from django.db.models import Q
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


class EntityStatus(ChoiceEnum):
    """
    Status of an entity (pending, active, hidden, removed...).
    """

    PENDING = IntegerChoice(0, _('Pending'))
    VALID = IntegerChoice(1, _('Valid'))
    HIDDEN = IntegerChoice(2, _('Hidden'))
    REMOVED = IntegerChoice(3, _('Removed'))


class EntityManager(models.Manager):
    # TODO est ce que django-polymorphic serait util ? car il apporte un iterator
    # et une optimisation via union sur les QuerySet, et aussi un cast automatique

    def get_by_uuid(self, uuid):
        return self.get(uuid=uuid)

    def get_by_content_type_and_id(self, app_label, model, id):
        content_type = ContentType.objects.get_by_natural_key(app_label, model)
        return self.get(content_type=content_type, id=id)


class Entity(models.Model):
    """
    Base model for any object that must support audit, history, or
    any other modular features.
    """
    content_type = models.ForeignKey(ContentType, editable=False)
    entity_status = models.IntegerField(
        null=False, blank=False, choices=EntityStatus.choices(), default=EntityStatus.VALID.value)

    created_date = models.DateTimeField(auto_now_add=True)
    modified_date = models.DateTimeField(auto_now=True)

    name = models.CharField(unique=True, null=False, blank=False, max_length=255, db_index=True)
    uuid = models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, unique=True)

    objects = EntityManager()

    class Meta:
        abstract = True

    def _get_content_type(self):
        return ContentType.objects.get_for_model(type(self))

    def save(self, *args, **kwargs):
        if not self.content_type_id:
            self.content_type = self._get_content_type()
        super(Entity, self).save(*args, **kwargs)

    def cast(self):
        return self.content_type.get_object_for_this_type(pk=self.pk)
