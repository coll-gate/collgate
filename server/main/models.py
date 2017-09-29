# -*- coding: utf-8; -*-
#
# @file models.py
# @brief coll-gate application models.
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2016-09-01
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

import logging
import re
import uuid as uuid

from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType
from django.contrib.postgres.fields import JSONField
from django.core.exceptions import SuspiciousOperation
from django.db import models, transaction, IntegrityError
from django.db.models import Q
from django.utils import translation
from django.utils.translation import ugettext_lazy as _

from igdectk.common.models import ChoiceEnum, IntegerChoice, StringChoice

logger = logging.getLogger('collgate')


class Profile(models.Model):
    """
    Additional information about a user.
    """

    # related user model
    user = models.OneToOneField(User)

    # newly created profile are in pending state
    pending = models.BooleanField(default=True)

    # information about the organisation where the user is located
    organisation = models.CharField(max_length=127)

    # comment from an administrator about this user profile
    admin_status = models.CharField(max_length=512)

    # user saved settings as JSON object
    settings = models.TextField(default="{}")


class Settings(models.Model):
    """
    Global setting table.
    """

    param_name = models.CharField(max_length=127)
    value = models.CharField(max_length=1024)


class InterfaceLanguages(ChoiceEnum):
    """
    Static for purposes.
    """

    EN = StringChoice('en', _('English'))
    FR = StringChoice('fr', _('French'))


class Language(models.Model):
    """
    Defines the list of configured languages for data (not UI).
    """

    # code pattern
    CODE_VALIDATOR = {"type": "string", "minLength": 2, "maxLength": 5, "pattern": "^[a-zA-Z]{2}([_-][a-zA-Z]{2})*$"}

    # label validator
    LABEL_VALIDATOR = {"type": "string", "minLength": 1, "maxLength": 128, "pattern": r"^[^\s]+(\s+[^\s]+)*$"}

    # label validator optional
    LABEL_VALIDATOR_OPTIONAL = {
        "type": "string", "minLength": 1, "maxLength": 128, "pattern": r"^[^\s]+(\s+[^\s]+)*$", "required": False}

    # language code
    code = models.CharField(max_length=5, null=False, blank=False)

    # Label of the language
    # It is i18nized used JSON dict with language code as key and label as string value.
    label = JSONField(default={})

    def get_label(self):
        """
        Get the label for this meta model in the current regional.
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

    # language type validator (blank or fr or fr_FR...)
    LANGUAGE_VALIDATOR = {
        "type:": "string", "minLength": 0, "maxLength": 5, "pattern": r"^([a-zA-Z-]{2,5}){0,1}$", "blank": True}

    # content type validator
    CONTENT_TYPE_VALIDATOR = {"type": "string", "minLength": 3, "maxLength": 64, "pattern": r"^[a-z]{3,}\.[a-z]{3,}$"}

    # permission string validator
    PERMISSION_VALIDATOR = {"type": "string", "minLength": 3, "maxLength": 64,  "pattern": r"^\S+[a-z-_]+\S+$"}

    # entity status validator
    ENTITY_STATUS_VALIDATOR = {"type": "integer", "minimum": 0, "maximum": 3}

    # entity status validator
    ENTITY_STATUS_VALIDATOR_OPTIONAL = {"type": "integer", "minimum": 0, "maximum": 3, "required": False}

    # label validator
    LABEL_VALIDATOR = {"type": "string", "minLength": 1, "maxLength": 128, "pattern": r"^[^\s]+(\s+[^\s]+)*$"}

    # label validator optional
    LABEL_VALIDATOR_OPTIONAL = {
        "type": "string", "minLength": 1, "maxLength": 128, "pattern": r"^[^\s]+(\s+[^\s]+)*$", "required": False}

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

    def details(self):
        """
        Return the details field for the specialized entity. By default return an empty dict.
        :return: A dict of details
        """
        return {}

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

    # message in a JSON text field with an object where key are language code and value are message in locale
    message = models.CharField(max_length=4096)


class EntitySynonymType(models.Model):
    """
    Type of a synonym for a concrete entity model.
    """

    # name pattern
    NAME_VALIDATOR = {"type": "string", "minLength": 3, "maxLength": 128, "pattern": "^[a-zA-Z0-9\-\_]+$"}

    # name pattern
    NAME_VALIDATOR_OPTIONAL = {"type": "string", "minLength": 3, "maxLength": 128, "pattern": "^[a-zA-Z0-9\-\_]+$",
                               "require": False}

    # label validator
    LABEL_VALIDATOR = {"type": "string", "minLength": 1, "maxLength": 128, "pattern": r"^[^\s]+(\s+[^\s]+)*$"}

    # label validator optional
    LABEL_VALIDATOR_OPTIONAL = {
        "type": "string", "minLength": 1, "maxLength": 128, "pattern": r"^[^\s]+(\s+[^\s]+)*$", "required": False}

    # content type validator
    TARGET_MODEL_VALIDATOR = {"type": "string", "minLength": 3, "maxLength": 64, "pattern": r"^[a-z]{3,}\.[a-z]{3,}$"}

    # synonym display name (default for each entity is 'code', 'primary' and 'alternate_name'
    name = models.CharField(max_length=128, db_index=True)

    # unique means the name of the synonym is unique for the couple (target, synonym_type)
    unique = models.BooleanField(default=False)

    # If false, only a single synonym of this type is allowed per instance of target entity.
    # For example, false for a code, true for an alternate name.
    multiple_entry = models.BooleanField(default=False)

    # if true the language code is necessary to the synonym. in practice uses false for type like codes
    has_language = models.BooleanField(default=True)

    # target model
    target_model = models.ForeignKey(ContentType)

    # Is this type of synonym can be deleted when it is empty
    can_delete = models.BooleanField(default=True)

    # Is this type of synonym can be modified (rename, add/remove ranks) by an authorized staff people
    can_modify = models.BooleanField(default=True)

    # Display labels
    # It is i18nized used JSON dict with language code as key and label as string value.
    label = JSONField(default={})

    def natural_name(self):
        return self.name

    def get_label(self):
        """
        Get the label for this meta model in the current regional.
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


class EntitySynonym(Entity):
    """
    Abstract model for synonym of entity.
    """

    # entity must be defined to the foreign model when specialized
    entity = None  # models.ForeignKey(ConcreteEntityModel, related_name='synonyms')

    # synonym display name
    name = models.CharField(max_length=128, db_index=True)

    # related type of synonym
    synonym_type = models.ForeignKey(EntitySynonymType)

    # language code
    language = models.CharField(max_length=5, default="", blank=True, null=False)

    class Meta:
        abstract = True

    def natural_name(self):
        return self.name

    @classmethod
    def make_search_by_name(cls, term):
        return Q(name__istartswith=term)

    def audit_create(self, user):
        return {
            'entity': self.entity_id,
            'name': self.name,
            'synonym_type': self.synonym_type_id,
            'language': self.language
        }

    def audit_update(self, user):
        if hasattr(self, 'updated_fields'):
            result = {'updated_fields': self.updated_fields}

            if 'name' in self.updated_fields:
                result['name'] = self.name

            if 'synonym_type' in self.updated_fields:
                result['type'] = self.synonym_type_id

            if 'language' in self.updated_fields:
                result['language'] = self.language

            return result
        else:
            return {
                'name': self.name,
                'synonym_type': self.synonym_type_id,
                'language': self.language,
            }

    def audit_delete(self, user):
        return {
            'name': self.name
        }

    def is_primary(self):
        return False

    def is_code(self):
        return False

    @classmethod
    def add_entity_synonym(cls, entity, synonym_type, name, language_code):
        """
        Add a new synonym to a valid entity. According to the rules of the type of synonym, allow or forbid the
        creation.

        :param entity: Related entity
        :param synonym_type: Type of synonym model instance
        :param name: Name of the new synonym
        :param language_code: Language code or blank
        :return: A new entity synonym object instance
        """
        if language_code and not Language.objects.filter(code=language_code).exists():
            raise Exception(_('Invalid language code'))

        if not synonym_type.has_language and language_code:
            raise SuspiciousOperation(_('No language is supported for a synonym of this type'))

        if synonym_type.has_language and not language_code:
            raise SuspiciousOperation(_('A language must be defined for a synonym of this type'))

        # uniqueness by type, name and language
        synonyms_by_name = cls.objects.filter(name__iexact=name, synonym_type=synonym_type, language=language_code)

        if synonyms_by_name.exists():
            raise SuspiciousOperation(_('A similar synonym of this type exists for this entity'))

        # uniqueness by type, name and model
        synonyms_by_model = cls.objects.filter(name__iexact=name, synonym_type=synonym_type, entity=entity)

        if synonym_type.unique and synonyms_by_model.exists():
            raise SuspiciousOperation(_('The synonym must be unique'))

        # single or multiple per entity
        synonyms_by_type = entity.synonyms.filter(synonym_type=synonym_type)

        if not synonym_type.multiple_entry and synonyms_by_type.exists():
            raise SuspiciousOperation(_('Only a single synonym of this type per entity is allowed'))

        entity_synonym = entity.synonyms.create(
            entity=entity,
            name=name,
            language=language_code,
            synonym_type=synonym_type)

        return entity_synonym

    @classmethod
    def rename(cls, entity, entity_synonym, name):
        """
        Rename the synonym of an entity according the new given name.
        Special case, if the synonym is a code or a primary name it also inside the transaction rename the code or
        name of the entity.

        :param entity: Related entity
        :param entity_synonym: Synonym to rename
        :param name: New name
        """
        # uniqueness by type, name and language
        synonyms_by_name = cls.objects.filter(
            name__iexact=name,
            synonym_type=entity_synonym.synonym_type,
            language=entity_synonym.language).exclude(id=entity_synonym.id)

        if synonyms_by_name.exists():
            raise SuspiciousOperation(_('A similar synonym of this type exists for this entity'))

        # uniqueness by type, name and model
        synonyms_by_model = cls.objects.filter(
            name__iexact=name, synonym_type=entity_synonym.synonym_type, entity=entity).exclude(id=entity_synonym.id)

        if entity_synonym.synonym_type.unique and synonyms_by_model.exists():
            raise SuspiciousOperation(_('The synonym must be unique'))

        # single or multiple per entity
        synonyms_by_type = entity.synonyms.filter(
            synonym_type=entity_synonym.synonym_type).exclude(id=entity_synonym.id)

        if not entity_synonym.synonym_type.multiple_entry and synonyms_by_type.exists():
            raise SuspiciousOperation(_('Only a single synonym of this type per entity is allowed'))

        try:
            with transaction.atomic():
                # rename the accession if the synonym is the GRC code name
                if entity_synonym.is_code():
                    entity.code = name
                    entity.update_field('code')
                    entity.save()
                # or if is the primary name
                elif entity_synonym.is_primary():
                    entity.name = name
                    entity.update_field('name')
                    entity.save()

                entity_synonym.name = name
                entity_synonym.update_field('name')
                entity_synonym.save()
        except IntegrityError as e:
            logger.log(repr(e))
            raise SuspiciousOperation(_("Unable to rename the synonym of the entity"))
