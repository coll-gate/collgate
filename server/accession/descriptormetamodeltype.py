# -*- coding: utf-8; -*-
#
# @file descriptormetamodeltype.py
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
from descriptor.descriptormetamodeltype import DescriptorMetaModelType
from descriptor.models import DescriptorValue, DescriptorMetaModel


class DescriptorMetaModelTypeAccession(DescriptorMetaModelType):
    """
    Specialisation for an accession entity.
    """

    def __init__(self):
        super().__init__()

        self.model = Accession
        self.verbose_name = _("Accession")
        self.data_fields = ["primary_classification", "batch_descriptor_meta_models"]

    def check(self, data):
        schema = {
            "type": "object",
            "properties": {
                "primary_classification": {"type": "number"},
                "batch_descriptor_meta_models": {
                    "type": "array", 'minLength': 1, 'maxLength': 100, 'items': [{'type': 'number'}]
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
        dmm_ids = [int(x) for x in data['batch_descriptor_meta_models']]
        dmms = DescriptorMetaModel.objects.filter(id__in=dmm_ids)

        if dmms.count() != len(dmm_ids):
            return _("The list of descriptor meta-models of batches must refers to existing objects")

        return None


class DescriptorMetaModelTypeBatch(DescriptorMetaModelType):
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
