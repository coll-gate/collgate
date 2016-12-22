# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
coll-gate descriptor module, descriptor
"""
import json
import re
import decimal

from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ObjectDoesNotExist
from django.shortcuts import get_object_or_404
from django.views.decorators.cache import cache_page
from django.utils.translation import ugettext_lazy as _

from descriptor.models import DescriptorMetaModel, DescriptorPanel, DescriptorModelTypeCondition
from igdectk.rest import Format, Method
from igdectk.rest.response import HttpResponseRest

from .descriptor import RestDescriptor


# YYYYMMDD date format
DATE_RE = re.compile(r'^(\d{4})([01]\d)([0-3]\d)$')
# HH:MM:SS time format
TIME_RE = re.compile(r'^([0-2]\d):([0-5]\d):([0-5]\d)$')
# ISO 8601 date time extended format with seconds
DATETIME_RE = re.compile(r'^\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z)$')


class RestDescribable(RestDescriptor):
    regex = r'^describable/$'
    name = 'describable'


@cache_page(60*60*24)
@RestDescribable.def_request(Method.GET, Format.JSON)
def get_describable_list(request):
    """
    Return the list of describable entities.
    """
    describables = []

    from django.apps import apps
    for entity in apps.get_app_config('descriptor').describable_entities:
        content_type = get_object_or_404(
            ContentType, app_label=entity._meta.app_label, model=entity._meta.model_name)

        describables.append({
            'id': content_type.pk,
            'value': "%s.%s" % (entity._meta.app_label, entity._meta.model_name),
            'label': str(entity._meta.verbose_name.capitalize())
        })

    return HttpResponseRest(request, describables)




def check_and_defines_descriptors(entity_descriptors, descriptor_meta_model, descriptors):
    results = {}

    dps = DescriptorPanel.objects.filter(descriptor_meta_model=descriptor_meta_model).order_by('position')
    dps.select_related('descriptor_model')

    for panel in dps:
        descriptor_model = panel.descriptor_model

        for dmt in descriptor_model.descriptor_model_types.all().order_by('position').select_related('descriptor_type'):
            descriptor_type = dmt.descriptor_type

            # values are loaded on demand (displaying the panel or opening the dropdown)
            format = json.loads(descriptor_type.format)

            conditions = DescriptorModelTypeCondition.objects.filter(descriptor_model_type_id=dmt.id)
            key = str(dmt.id)

            acc_value = entity_descriptors[str(dmt.id)] if key in entity_descriptors else None
            src_value = descriptors[str(dmt.id)] if key in descriptors else None

            # mandatory descriptor
            if dmt.mandatory:
                if src_value is None and acc_value is None:
                    raise ValueError(_("Missing mandatory descriptor %s") % (dmt.get_label(),))

            # set once descriptor
            if dmt.set_once:
                if src_value is not None and acc_value is not None:
                    raise ValueError(_("Already defined set once descriptor %s") % (dmt.get_label(),))

            if conditions.exists():
                # check condition
                dmtc = conditions[0]

                # according to the condition if the current value is defined (src) or was defined (acc)
                # the condition must be respected otherwise raise an exception if a new value is defined (src)
                # if dmtc.condition > 0:
                #     # @todo
                #     key = dmtc.target.id
                #
                #     if key not in entity_descriptors and key not in descriptors:
                #         raise ValueError(_("A condition require a value for a descriptor and this value is not defined"))

            if src_value:
                # validate the source value
                if format['type'].startswith("enum_"):
                    # check if the value is a string and exists into the type of descriptor
                    if not isinstance(src_value, str):
                        raise ValueError(_("The descriptor value must be a string") + " (%s)" % dmt.get_label())

                    # check if the value exists
                    try:
                        dmt.descriptor_type.get_value(src_value)
                    except ObjectDoesNotExist:
                        raise ValueError(_("The descriptor value must exists") + " (%s)" % dmt.get_label())

                elif format['type'] == "entity":
                    # check if the value is an integer and if the related entity exists
                    if not isinstance(src_value, int):
                        raise ValueError(_("The descriptor value must be an integer") + " (%s)" % dmt.get_label())

                    # check if the entity exists
                    try:
                        app_label, model = format['model'].split('.')
                        content_type = get_object_or_404(ContentType, app_label=app_label, model=model)
                        content_type.get_object_for_this_type(id=src_value)
                    except ObjectDoesNotExist:
                        raise ValueError(_("The descriptor value must refers to an existing entity") + " (%s)" % dmt.get_label())

                elif format['type'] == "ordinal":
                    # check if the value is an integer into the range min/max
                    if not isinstance(src_value, int):
                        raise ValueError(_("The descriptor value must be an integer") + " (%s)" % dmt.get_label())

                    # check min/max
                    if src_value < int(format['range'][0]) or src_value > int(format['range'][1]):
                        raise ValueError(_("The descriptor value must be an integer between ") + " %i and %i (%s)" % (
                            format['range'][0], format['range'][1], dmt.get_label()))

                elif format['type'] == "boolean":
                    # check if the value is a boolean
                    if not isinstance(src_value, bool):
                        raise ValueError(_("The descriptor value must be a boolean") + " (%s)" % dmt.get_label())

                elif format['type'] == "date":
                    # check if the value is a YYYYMMDD date
                    if not isinstance(src_value, str) or DATE_RE.match(src_value) is None:
                        raise ValueError(_("The descriptor value must be a date string (YYYYMMDD)") + " (%s)" % dmt.get_label())

                elif format['type'] == "time":
                    # check if the value is a HH:MM:SS time
                    if not isinstance(src_value, str) or TIME_RE.match(src_value) is None:
                        raise ValueError(_("The descriptor value must be a time string (HH:MM:SS)") + " (%s)" % dmt.get_label())

                elif format['type'] == "datetime":
                    # check if the value is an ISO and UTC (convert to UTC if necessary)
                    if not isinstance(src_value, str) or DATETIME_RE.match(src_value) is None:
                        raise ValueError(_("The descriptor value must be a datetime string (ISO 8601)") + " (%s)" % dmt.get_label())

                elif format['type'] == "numeric":
                    # check if the value is a decimal (string with digits - and .) with the according precision of
                    # decimals
                    if not isinstance(src_value, str):
                        raise ValueError(_("The descriptor value must be a decimal string") + " (%s)" % dmt.get_label())

                    # check format
                    try:
                        dec = decimal.Decimal(src_value)
                    except decimal.InvalidOperation:
                        raise ValueError(_("The descriptor value must be a decimal") + " (%s)" % dmt.get_label())

                    # and precision
                    if dec.as_tuple().exponent != -int(decimal.Decimal(format['precision'])):
                        raise ValueError(_("The descriptor value must be a decimal with a precision of ") + " %s (%s)" % (
                            format['precision'], dmt.get_label()))

                elif format['type'] == "numeric_range":
                    # check if the value is a decimal (string with digits - and .) with the according precision of
                    # decimals and into the range min/max
                    if not isinstance(src_value, str):
                        raise ValueError(_("The descriptor value must be a decimal") + " (%s)" % dmt.get_label())

                    # check format
                    try:
                        dec = decimal.Decimal(src_value)
                    except decimal.InvalidOperation:
                        raise ValueError(_("The descriptor value must be a decimal") + " (%s)" % dmt.get_label())

                    # precision
                    if dec.as_tuple().exponent != -int(decimal.Decimal(format['precision'])):
                        raise ValueError(
                            _("The descriptor value must be a decimal with a precision of ") + " %s (%s)" % (
                                format['precision'], dmt.get_label()))

                    # and min/max
                    if dec < decimal.Decimal(format['range'][0]) or dec > decimal.Decimal(format['range'][1]):
                        if not isinstance(src_value, str):
                            raise ValueError(_("The descriptor value must be a decimal between") + " %i and %i (%s)" % (
                                format['range'][0], format['range'][1], dmt.get_label()))

                elif format['type'] == "string":
                    # check if the value is a string matching the regexp and the max length of 1024 characters
                    if not isinstance(src_value, str):
                        raise ValueError(_("The descriptor value must be a string") + " (%s)" % dmt.get_label())

                    # test max length
                    if len(src_value) > 1024:
                        raise ValueError(
                            _("The descriptor value must be a string with a maximum length of 1024 characters") +
                            " (%s)" % dmt.get_label())

                    # test regexp
                    if "regexp" in format and format['regexp']:
                        str_re = re.compile(format['regexp'])
                        if str_re.match(src_value) is None:
                            raise ValueError(_("The descriptor value must be a string matching the defined format") +
                                             " (%s)" % dmt.get_label())

            results[dmt.id] = src_value

    return results
