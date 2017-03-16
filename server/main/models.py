# -*- coding: utf-8; -*-
#
# Copyright (c) 2014 INRA UMR1095 GDEC

"""
coll-gate application models.
"""

import re
import uuid as uuid

from django.core.exceptions import SuspiciousOperation
from django.core.validators import RegexValidator
from django.db import models
from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType
from django.db.models import Q
from django.utils.translation import ugettext_lazy as _

from igdectk.common.models import ChoiceEnum, IntegerChoice, StringChoice


class Profile(models.Model):
    """
    Additional information about a user.
    """

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

    # related user
    user = models.OneToOneField(User)

    # state of the account (to be checked during authentication)
    state = models.IntegerField(default=STATE_CREATED, choices=PROFILE_STATES)

    # information about the company where the user is located
    company = models.CharField(max_length=127)

    admin_status = models.CharField(max_length=512)

    # user saved settings as JSON object
    settings = models.TextField(default="{}")


class Settings(models.Model):
    """
    IgdecTk application setting table.
    """

    param_name = models.CharField(max_length=127)
    value = models.CharField(max_length=1024)


class Languages(ChoiceEnum):
    """
    Static for purposes.
    """

    LA = StringChoice('la', _('Latin'))
    EN = StringChoice('en', _('English'))
    FR = StringChoice('fr', _('French'))


class InterfaceLanguages(ChoiceEnum):
    """
    Static for purposes.
    """

    EN = StringChoice('en', _('English'))
    FR = StringChoice('fr', _('French'))


class EntityStatus(ChoiceEnum):
    """
    Status of an entity (pending, active, hidden, removed...).
    """

    PENDING = IntegerChoice(0, _('Pending'))
    VALID = IntegerChoice(1, _('Valid'))
    ARCHIVED = IntegerChoice(2, _('Archived'))
    REMOVED = IntegerChoice(3, _('Removed'))


class EntityManager(models.Manager):
    """
    Entity manager overriding.
    """

    def get_by_uuid(self, entity_uuid):
        """
        Get an entity by its UUID.
        """
        return self.get(uuid=entity_uuid)


class Entity(models.Model):
    """
    Base model for any object that must support audit, history, or any other modular features.
    """

    # simple name pattern with alphanumeric characters plus _ and - with a least a length of 3
    NAME_RE = re.compile(r'^[a-zA-Z0-9_-]{3,}$', re.IGNORECASE)

    # content type natural key pattern : <application_name>.<model_name>
    CONTENT_TYPE_RE = re.compile(r'^[a-z]{3,}\.[a-z]{3,}$')

    # default name validator
    NAME_VALIDATOR = {"type": "string", "minLength": 3, "maxLength": 32, "pattern": "^[a-zA-Z0-9\-\_]+$"}

    # default name validator optional
    NAME_VALIDATOR_OPTIONAL = {
        "type": "string", "minLength": 3, "maxLength": 32, "pattern": "^[a-zA-Z0-9\-\_]+$", "required": False}

    # language type validator
    LANGUAGE_VALIDATOR = {"type:": "string", "minLength": 2, "maxLength": 5, "pattern": r"^[a-zA-Z-]{2,5}$"}

    # content type validator
    CONTENT_TYPE_VALIDATOR = {"type": "string", "minLength": 3, "maxLength": 64, "pattern": r"^[a-z]{3,}\.[a-z]{3,}$"}

    # permission string validator
    PERMISSION_VALIDATOR = {"type": "string", "minLength": 3, "maxLength": 64,  "pattern": r"^\S+[a-z-_]+\S+$"}

    # entity status validator
    ENTITY_STATUS_VALIDATOR = {"type": "integer", "minimum": 0, "maximum": 3}

    # entity status validator
    ENTITY_STATUS_VALIDATOR_OPTIONAL = {"type": "integer", "minimum": 0, "maximum": 3, "required": False}

    # label validator
    LABEL_VALIDATOR = {"type": "string", "minLength": 1, "maxLength": 128, "pattern": r"^\S+.+\S+$"}

    # label validator optional
    LABEL_VALIDATOR_OPTIONAL = {
        "type": "string", "minLength": 1, "maxLength": 128, "pattern": r"^\S+.+\S+$", "required": False}

    # content type of the entity
    content_type = models.ForeignKey(ContentType, editable=False)

    # status of the entity
    entity_status = models.IntegerField(
        null=False, blank=False, choices=EntityStatus.choices(), default=EntityStatus.VALID.value)

    # insert date
    created_date = models.DateTimeField(auto_now_add=True)
    # last update date
    modified_date = models.DateTimeField(auto_now=True)

    # unique object identifier
    uuid = models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, unique=True)

    objects = EntityManager()

    class Meta:
        abstract = True

    def _get_content_type(self):
        return ContentType.objects.get_for_model(type(self))

    def save(self, *args, **kwargs):
        """
        Save is overridden to auto-defines the content_type if necessary
        """
        if not self.content_type_id:
            self.content_type = self._get_content_type()
        super(Entity, self).save(*args, **kwargs)

    def cast(self):
        return self.content_type.get_object_for_this_type(pk=self.pk)

    def update_field(self, field_name):
        """
        Update the updated fields with a single or a list of field names.
        :param field_name: String or tuple or list or field names
        :return:
        """
        if not hasattr(self, 'updated_fields'):
            self.updated_fields = []

        if isinstance(field_name, str):
            if field_name not in self.updated_fields:
                self.updated_fields.append(field_name)
        elif isinstance(field_name, list) or isinstance(field_name, tuple):
            self.updated_fields += [name for name in field_name if name not in self.updated_fields]

    @classmethod
    def is_name_valid(cls, name):
        """
        Check whether or not the name respect a certain convention [a-zA-Z0-9_-]{3,}.
        """
        if name is None or not isinstance(name, str):
            return False

        return Entity.NAME_RE.match(name) is not None

    @classmethod
    def is_content_type_valid(cls, name):
        """
        Check whether or not the name of the content type respect the format.
        """
        if name is None or not isinstance(name, str):
            return False

        return Entity.CONTENT_TYPE_RE.match(name) is not None

    @classmethod
    def get_by_content_type_and_id(cls, app_label, model, id):
        """
        Get an entity by its content type (app_label, model) and its id.
        """
        content_type = ContentType.objects.get_by_natural_key(app_label, model)
        return content_type.get_object_for_this_type(id=id)

    def remove_entity(self):
        """
        Set the entity status as removed and save.
        """
        self.entity_status = EntityStatus.REMOVED.value
        self.save()

    def validate_entity(self):
        """
        Set the entity status as active and save.
        """
        self.entity_status = EntityStatus.VALID.value
        self.save()

    def hide_entity(self):
        """
        Set the entity status as hidden and save.
        """
        self.entity_status = EntityStatus.HIDDEN.value
        self.save()

    def set_status(self, entity_status):
        """
        Change the status of the entity in a possible way, otherwise raise an exception
        :param entity_status: New status of the entity (upgrade, not downgrade)
        """
        if entity_status == self.entity_status:
            return

        if entity_status == EntityStatus.PENDING.value and self.entity_status >= EntityStatus.VALID.value:
            raise SuspiciousOperation(_("It is not allowed to change the status of an entity from valid to pending"))

        if self.entity_status == EntityStatus.REMOVED.value:
            raise SuspiciousOperation(_("It is not allowed to change the status of a removed entity"))

        if self.entity_status == EntityStatus.ARCHIVED.value:
            raise SuspiciousOperation(_("It is not allowed to change the status of an archived entity"))

        self.entity_status = entity_status

    def natural_name(self):
        """
        Return the most natural name for defining the specialised entity. By default return the uuid as name.
        :return: A string name
        """
        return self.uuid

    @classmethod
    def make_search_by_name(cls, term):
        """
        Return a query object for the most common name related to the model.
        :param term: String term to search for
        :return: A query object
        """
        return Q(uuid__startswith=term)


class EventMessage(models.Model):
    """
    Displayable and managed event message. No history, no audit, simple creation/deletion, no edition.
    """

    # author of the message
    author = models.ForeignKey(User)

    # creation date
    created_date = models.DateTimeField(auto_now_add=True)

    # message in a JSON text field with an object where key are language code and value
    # are message in locale
    message = models.TextField()
