# -*- coding: utf-8; -*-
#
# @file layouttype.py
# @brief coll-gate descriptor meta-model format type class
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2017-09-13
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details

import json
import re
import decimal

import validictory
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ObjectDoesNotExist, ImproperlyConfigured
from django.shortcuts import get_object_or_404
from django.utils import translation
from django.utils.translation import ugettext_lazy as _, pgettext_lazy
from django.db.models import Q

from accession.models import Accession, Batch
from classification.models import Classification
from descriptor.descriptorformatunit import DescriptorFormatUnitManager
from descriptor.layouttype import LayoutType
from descriptor.models import DescriptorValue, Layout


class LayoutTypeAccession(LayoutType):
    """
    Specialisation for an accession entity.
    """

    def __init__(self):
        super().__init__()

        self.model = Accession
        self.verbose_name = _("Accession")
        self.data_fields = ["primary_classification", "batch_layouts"]

    def check(self, data):
        schema = {
            "type": "object",
            "properties": {
                "primary_classification": {"type": "number"},
                "batch_layouts": {
                    "type": "array", 'minItems': 0, 'maxItems': 100, 'additionalItems': {'type': 'number'}, 'items': []
                }
            }
        }

        try:
            validictory.validate(data, schema)
        except validictory.MultipleValidationError as e:
            return str(e)

        # check if the classification exists
        try:
            Classification.objects.get(id=int(data['primary_classification']))
        except Classification.DoesNotExist:
            return _("The classification must refers to an existing object")

        # check if the batch meta-models exists
        layout_ids = [int(x) for x in data['batch_layouts']]
        layouts = Layout.objects.filter(id__in=layout_ids)

        if layouts.count() != len(layout_ids):
            return _("The list of descriptor meta-models of batches must refers to existing objects")

        # changes is not possible if there is some existing accessions entries using this meta-model
        # @todo check

        return None


class LayoutTypeBatch(LayoutType):
    """
    Specialisation for a batch entity.
    """

    def __init__(self):
        super().__init__()

        self.model = Batch
        self.verbose_name = _("Batch")
        self.data_fields = []

    def check(self, data):
        schema = {
            "type": "object",
            "properties": {
            }
        }

        try:
            validictory.validate(data, schema)
        except validictory.MultipleValidationError as e:
            return str(e)

        return None
