# -*- coding: utf-8; -*-
#
# @file descriptorformattype.py
# @brief coll-gate descriptor format type class
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2017-01-03
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details

from django.utils.translation import ugettext_lazy as _

from accession.models import Accession, Batch
from descriptor.descriptorformattype import DescriptorFormatType, DescriptorFormatTypeGroupReference


class DescriptorFormatTypeAccession(DescriptorFormatType):
    """
    Specialisation for a referred accession entity.
    """

    def __init__(self):
        super().__init__()

        self.name = "accession"
        self.group = DescriptorFormatTypeGroupReference()
        self.verbose_name = _("Accession")
        self.value_is_code = True
        self.related_model = Accession
        self.data = "INTEGER"

    def validate(self, descriptor_type_format, value, descriptor_model_type):
        # check if the value is an integer and if the related entity exists
        if not isinstance(value, int):
            return _("The descriptor value must be an integer")

        # check if the accession exists
        try:
            Accession.objects.get(id=value)
        except Accession.DoesNotExists:
            return _("The descriptor value must refers to an existing accession")

        return None

    def check(self, descriptor_type_format):
        return None

    def get_display_values_for(self, descriptor_type, descriptor_type_format, values, limit):
        items = {}

        # search for the accessions
        accessions = Accession.objects.filter(id__in=values)[:limit].values_list('id', 'name')

        for accession in accessions:
            items[accession[0]] = accession[1]

        return {
            'cacheable': False,
            'items': items
        }


class DescriptorFormatTypeBatch(DescriptorFormatType):
    """
    Specialisation for a referred batch entity.
    """

    def __init__(self):
        super().__init__()

        self.name = "batch"
        self.group = DescriptorFormatTypeGroupReference()
        self.verbose_name = _("Batch")
        self.value_is_code = True
        self.related_model = Batch
        self.data = "INTEGER"

    def validate(self, descriptor_type_format, value, descriptor_model_type):
        # check if the value is an integer and if the related entity exists
        if not isinstance(value, int):
            return _("The descriptor value must be an integer")

        # check if the batch exists
        try:
            Batch.objects.get(id=value)
        except Batch.DoesNotExists:
            return _("The descriptor value must refers to an existing batch")

        return None

    def check(self, descriptor_type_format):
        return None

    def get_display_values_for(self, descriptor_type, descriptor_type_format, values, limit):
        items = {}

        # search for the batch
        batches = Batch.objects.filter(id__in=values)[:limit].values_list('id', 'name')

        for batch in batches:
            items[batch[0]] = batch[1]

        return {
            'cacheable': False,
            'items': items
        }
