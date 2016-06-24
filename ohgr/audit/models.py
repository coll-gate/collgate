# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
ohgr application models.
"""
import json

from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import SuspiciousOperation
from django.db import models
from django.contrib.auth.models import User
from django.dispatch import receiver
from django.utils.translation import ugettext_lazy as _

from main.models import ChoiceEnum
from main.models import IntegerChoice

from igdectk.rest.restmiddleware import RestMiddleware

from main.models import Entity


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

    def create_audit(self, user, content_type, object_id, audit_type, reason, fields=[]):
        """
        Create a new audit entry for a user and an object.

        :param user: User model
        :param content_type: ContentType model or string like "appname.modelname"
        :param object: Valid object identifier
        :param type: One of the models.AuditType integer value
        :param reason: Cause of the audit operation. Can be a succinct comment or a more detailed message.
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

        if not reason:
            raise SuspiciousOperation(_("Missing audit reason"))

        audit = Audit(
            user=user,
            content_type=content_type,
            object_id=object_id,
            type=audit_type,
            reason=reason,
            fields=json.dumps(fields))

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

    user = models.ForeignKey(User, null=False, blank=False, db_index=True)
    content_type = models.ForeignKey(ContentType, null=False, blank=False)
    object_id = models.IntegerField()

    type = models.IntegerField(null=False, blank=False, choices=AuditType.choices(), default=0)
    timestamp = models.DateTimeField(auto_now_add=True)
    reason = models.TextField(null=False, blank=False)
    fields = models.TextField(null=False, blank=True)

    objects = AuditManager()

    class Meta:
        # to lookup on specific object for any users
        index_together = (("content_type", "object_id"),)
        # to lookup on specific object for a user
        index_together = (("user", "content_type", "object_id"), )

        # only staff can look at audit
        default_permissions = list()


def get_current_request_params():
    # get current request parameters
    return RestMiddleware.current_user(), RestMiddleware.current_remote_addr()
    # # hack to get the user of the request
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
    user, remote_addr = get_current_request_params()
    update_fields = kwargs.get('update_fields') or []

    if created:
        type = AuditType.CREATE

        if hasattr(sender, 'audit_create'):
            reason = instance.audit_create(user)
        else:  # generic
            reason = "Create %s with id %s" % (sender.__name__, instance.pk)
    else:
        type = AuditType.UPDATE

        if hasattr(sender, 'audit_update'):
            reason = instance.audit_update(user)
        else:  # generic
            reason = "Update %s(id=%s)" % (sender.__name__, instance.pk)

    content_type = ContentType.objects.get_for_model(sender)
    Audit.objects.create_audit(user, content_type, instance.pk, type, reason, update_fields)


@receiver(models.signals.post_delete, sender=Entity)
def entity_post_delete(sender, instance, **kwargs):
    user, remote_addr = get_current_request_params()

    if hasattr(sender, 'audit_delete'):
        reason = instance.audit_delete(user)
    else:
        reason = "Delete %s(id=%s)" % (sender.__name__, instance.pk)

    content_type = ContentType.objects.get_for_model(sender)
    Audit.objects.create_audit(user, content_type, instance.pk, AuditType.DELETE, reason, [])


@receiver(models.signals.m2m_changed, sender=Entity)
def entity_m2m_changed(sender, instance, action, reverse, model, **kwargs):
    user, remote_addr = get_current_request_params()

    if hasattr(sender, 'audit_m2m'):
        reason = instance.audit_m2m(user)
    else:
        reason = "%s %s m2m %s" % (sender.__name__, instance.pk, action)

    content_type = ContentType.objects.get_for_model(sender)
    Audit.objects.create_audit(user, content_type, instance.pk, AuditType.M2M_CHANGE, reason, [])


def register_models(app_name):
    content_types = ContentType.objects.filter(app_label=app_name)
    for content_type in content_types:
        model = content_type.model_class()
        models.signals.post_save.connect(entity_post_save, sender=model)
        models.signals.post_delete.connect(entity_post_delete, sender=model)
        models.signals.m2m_changed.connect(entity_m2m_changed, sender=model)
