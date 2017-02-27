# -*- coding: utf-8; -*-
#
# Copyright (c) 2017 INRA UMR1095 GDEC

"""
coll-gate organisation models.
"""

from django.db import models
from django.utils.translation import ugettext_lazy as _

from descriptor.models import DescribableEntity


class Organisation(DescribableEntity):
    """
    Organisation entity for management level.
    The descriptor meta-model is defined to the unique name "organisation".
    """

    # Descriptor type code
    TYPE_CODE = "IN_002"

    # undefined type as constant
    TYPE_UNDEFINED = "IN_002:0000001"

    # type of organisation is related to the type of descriptor IN_002 that is an 'enum_single'.
    type = models.CharField(max_length=16, default=TYPE_UNDEFINED)

    class Meta:
        verbose_name = _("Organisation")


class Establishment(DescribableEntity):
    """
    Location for an organisation.
    The descriptor meta-model is defined to the unique name "establishment".
    """

    # related organisation
    organisation = models.ForeignKey(Organisation, on_delete=models.CASCADE, related_name="establishments")

    class Meta:
        verbose_name = _("Establishment")


class GRC(models.Model):
    """
    Genetic resource center entity. Only one is configured for the application instance.
    """

    # identifier code or the GRC (@see code view of the FAO http://www.fao.org/wiews)
    identifier = models.CharField(max_length=256, default="undefined", blank=False)

    # name of the GRC
    name = models.CharField(max_length=256, default="Undefined GRC", blank=False)

    # general description
    description = models.TextField(default="", blank=True, null=False)

    # list of managers organisations
    organisations = models.ManyToManyField(Organisation)

    class Meta:
        verbose_name = _("Genetic Resource Center")


# @todo Contact for an establishment
