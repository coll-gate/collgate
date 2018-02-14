# -*- coding: utf-8; -*-
#
# @file models.py
# @brief coll-gate application models.
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2016-09-01
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import SuspiciousOperation
from django.db import models, connection
from django.contrib.auth.models import User
from django.dispatch import receiver
from django.utils.translation import ugettext_lazy as _
from django.contrib.postgres.fields import JSONField

from main.models import ChoiceEnum, EntityStatus
from main.models import IntegerChoice

from igdectk.rest.restmiddleware import RestMiddleware

from main.models import Entity
from . import localsettings


class AuditManager(models.Manager):

    def for_user(self, user):
        """
        Lookup any audits for a specific user.

        :param user: User model
        :return: Query set
        """
        if user:
            return Audit.objects.filter(user=user)
        else:
            return Audit.objects.none()

    def for_object(self, content_type, object_id):
        """
        Lookup any audits for a specific object.

        :param content_type: ContentType model or string like "appname.modelname"
        :param object_id: Object identifier
        :return: Query set
        """
        if isinstance(content_type, str):
            app_name, model = content_type.split('.')
            content_type = ContentType.objects.get_by_natural_key(app_name, model)

        if not content_type or not isinstance(content_type, ContentType):
            raise SuspiciousOperation(_("Invalid content type or application name"))

        if not object_id:
            raise SuspiciousOperation(_("Invalid object identifier"))

        return Audit.objects.filter(content_type=content_type, object_id=object_id)

    def for_user_and_object(self, user, content_type, object_id):
        """
        Lookup any audit for a specific user and object.

        :param user: User model
        :param content_type: ContentType model or string like "appname.modelname"
        :param object_id: Object identifier
        :return: Query set
        """
        if isinstance(content_type, str) and content_type.find('.') > 0:
            app_name, model = content_type.split('.')
            content_type = ContentType.objects.get_by_natural_key(app_name, model)

        if not content_type or not isinstance(content_type, ContentType):
            raise SuspiciousOperation(_("Invalid content type or application name"))

        if not object_id:
            raise SuspiciousOperation(_("Invalid object identifier"))

        if not user or not isinstance(user, User):
            raise SuspiciousOperation(_("Invalid user"))

        return Audit.objects.filter(user=user, content_type=content_type, object_id=object_id)

    def create_audit(self, user, content_type, object_id, audit_type, fields={}):
        """
        Create a new audit entry for a user and an object.

        :param user: User model
        :param content_type: ContentType model or string like "appname.modelname"
        :param object_id: Valid object identifier
        :param audit_type: One of the models.AuditType integer value
        :param fields: A list of modified field name or empty list
        :return:
        """
        if isinstance(content_type, str) and content_type.find('.') > 0:
            app_name, model = content_type.split('.')
            content_type = ContentType.objects.get_by_natural_key(app_name, model)

        if not content_type or not isinstance(content_type, ContentType):
            raise SuspiciousOperation(_("Invalid content type or application name"))

        if not object_id:
            raise SuspiciousOperation(_("Invalid object identifier"))

        if not user or not isinstance(user, User):
            raise SuspiciousOperation(_("Invalid user"))

        audit = Audit(
            user=user,
            content_type=content_type,
            object_id=object_id,
            type=audit_type,
            fields=fields)

        audit.save()

    def purge_audit(self, datetime):
        """
        Purge any audit entry that have a date-time greater or equal to datetime.

        :param datetime: Valid datetime object instance
        :return: Number of deleted entries
        """
        qs = Audit.objects.filter(timestamp__lte=datetime)
        return qs.delete()


class AuditType(ChoiceEnum):
    """
    Type of action of the audit.
    Remove differs from delete in that delete is a deletion of the
    object from the database, than remove is an update with a state of deleted, but
    the object still in database for consistency.

    Action is a more complex process that affects more than a single object,
    or any what you need when you want a different type than any others types.

    M2M_CHANGE means many to many change. It is used on m2m_change, and it is
    a special case of CRUD operation.
    """

    CREATE = IntegerChoice(0, _('Create'))
    UPDATE = IntegerChoice(1, _('Update'))
    DELETE = IntegerChoice(2, _('Delete'))

    REMOVE = IntegerChoice(3, _('Remove'))
    ACTION = IntegerChoice(4, _('Action'))

    M2M_CHANGE = IntegerChoice(5, _('M2M change'))


class Audit(models.Model):
    """
    Trace some actions (CRUD on models, and actions for process).
    To trace on a process you must use the main.models.Action model
    as content type, and to register the action into the DB.
    """

    # user cannot be deleted, only deactivated
    user = models.ForeignKey(User, null=False, blank=False, db_index=True, on_delete=models.PROTECT)

    # content type never might be deleted
    content_type = models.ForeignKey(ContentType, null=False, blank=False, on_delete=models.PROTECT)
    object_id = models.IntegerField()

    type = models.IntegerField(null=False, blank=False, choices=AuditType.choices(), default=0)
    timestamp = models.DateTimeField(auto_now_add=True)
    fields = JSONField(default={}, null=False, blank=False)

    objects = AuditManager()

    class Meta:
        # - to lookup for a specific object for any users
        # - to lookup for a user for any objects
        # - to lookup for a specific object for a specific user
        index_together = (
            ("timestamp", "id", "content_type", "object_id"),
            ("timestamp", "id", "user"),
            ("timestamp", "id", "user", "content_type", "object_id")
        )

        # only staff can look at audit
        default_permissions = list()


def get_current_request_params():
    # in migration mode user and remote address comes from local settings
    if localsettings.migration_mode and localsettings.migration_audit:
        return localsettings.migration_user, "127.0.0.1"
    else:
        # else the user and the remote address comes from the state of the middleware
        return RestMiddleware.current_user(), RestMiddleware.current_remote_addr()

    # hack to get the user of the request (this is another solution to get it directly from the call-stack
    # import inspect
    #
    # for frame_record in inspect.stack():
    #     if frame_record[3] == 'get_response':
    #         request = frame_record[0].f_locals['request']
    #         break
    # else:
    #     request = None
    #
    # if request:
    #     return request.user, request.META.get('REMOTE_ADDR', '')


@receiver(models.signals.post_save, sender=Entity)
def entity_post_save(sender, instance, created, **kwargs):
    # if audit globally disabled
    if not localsettings.migration_audit:
        return

    user, remote_addr = get_current_request_params()

    if created:
        a_type = AuditType.CREATE

        if hasattr(sender, 'audit_create'):
            fields = instance.audit_create(user)
        else:
            fields = {}

        # None means ignore audit
        if fields is None:
            return

        # add the uuid of the instance
        if hasattr(instance, 'uuid'):
            fields['uuid'] = str(instance.uuid)
    elif hasattr(instance, 'entity_status') and instance.entity_status == EntityStatus.REMOVED:
        a_type = AuditType.REMOVE

        if hasattr(sender, 'audit_update'):
            fields = instance.audit_update(user)
        else:
            fields = {}

        # None means ignore audit
        if fields is None:
            return
    else:
        a_type = AuditType.UPDATE

        if hasattr(sender, 'audit_update'):
            fields = instance.audit_update(user)
        else:
            fields = {}

        # None means ignore audit
        if fields is None:
            return

    # always add the status of the entity
    if hasattr(instance, 'entity_status'):
        fields['entity_status'] = instance.entity_status

    content_type = ContentType.objects.get_for_model(sender)
    Audit.objects.create_audit(user, content_type, instance.pk, a_type, fields)


@receiver(models.signals.post_delete, sender=Entity)
def entity_post_delete(sender, instance, **kwargs):
    # if audit globally disabled
    if not localsettings.migration_audit:
        return

    user, remote_addr = get_current_request_params()

    if hasattr(sender, 'audit_delete'):
        fields = instance.audit_delete(user)
    else:
        fields = {}

    # None means ignore audit
    if fields is None:
        return

    content_type = ContentType.objects.get_for_model(sender)
    Audit.objects.create_audit(user, content_type, instance.pk, AuditType.DELETE, fields)


@receiver(models.signals.m2m_changed, sender=Entity)
def entity_m2m_changed(sender, instance, action, reverse, model, **kwargs):
    # if audit globally disabled
    if not localsettings.migration_audit:
        return

    user, remote_addr = get_current_request_params()

    if hasattr(sender, 'audit_m2m'):
        fields = instance.audit_m2m(user)
    else:
        fields = {}

    # None means ignore audit
    if fields is None:
        return

    content_type = ContentType.objects.get_for_model(sender)
    Audit.objects.create_audit(user, content_type, instance.pk, AuditType.M2M_CHANGE, fields)


def audit_register_models(app_name):
    if 'django_content_type' not in connection.introspection.table_names():
        return

    content_types = ContentType.objects.filter(app_label=app_name)
    for content_type in content_types:
        model = content_type.model_class()
        models.signals.post_save.connect(entity_post_save, sender=model)
        models.signals.post_delete.connect(entity_post_delete, sender=model)
        models.signals.m2m_changed.connect(entity_m2m_changed, sender=model)


def audit_unregister_models(app_name):
    if 'django_content_type' not in connection.introspection.table_names():
        return

    content_types = ContentType.objects.filter(app_label=app_name)
    for content_type in content_types:
        model = content_type.model_class()
        models.signals.post_save.disconnect(entity_post_save, sender=model)
        models.signals.post_delete.disconnect(entity_post_delete, sender=model)
        models.signals.m2m_changed.disconnect(entity_m2m_changed, sender=model)
