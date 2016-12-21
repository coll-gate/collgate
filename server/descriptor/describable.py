# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
coll-gate descriptor module, descriptor
"""
import json

from django.contrib.contenttypes.models import ContentType
from django.shortcuts import get_object_or_404
from django.views.decorators.cache import cache_page
from django.utils.translation import ugettext_lazy as _

from descriptor.models import DescriptorMetaModel, DescriptorPanel, DescriptorModelTypeCondition
from igdectk.rest import Format, Method
from igdectk.rest.response import HttpResponseRest

from .descriptor import RestDescriptor


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
                if format.type.startswith("enum_"):
                    # check if the value is a string and exists into the type of descriptor
                    if not isinstance(src_value, str):
                        raise ValueError(_("The descriptor value must be a string") + " (%s)" % dmt.get_label())

                    # check if the value exists
                    # @todo
                elif format.type == "entity":
                    # check if the value is an integer and if the related entity exists
                    if not isinstance(src_value, str):
                        raise ValueError(_("The descriptor value must be a string") + " (%s)" % dmt.get_label())

                    # check if the entity exists
                    # @todo
                elif format.type == "ordinal":
                    # check if the value is an integer into the range min/max
                    if not isinstance(src_value, int):
                        raise ValueError(_("The descriptor value must be an integer") + " (%s)" % dmt.get_label())

                    # check min/max
                    # @todo
                elif format.type == "boolean":
                    # check if the value is a boolean
                    if not isinstance(src_value, bool):
                        raise ValueError(_("The descriptor value must be a boolean") + " (%s)" % dmt.get_label())
                elif format.type == "date":
                    # check if the value is a YYYYMMDD date
                    if not isinstance(src_value, str):
                        raise ValueError(_("The descriptor value must be a date string (YYYYMMDD)") + " (%s)" % dmt.get_label())

                    # check format
                    # @todo
                elif format.type == "time":
                    # check if the value is a HH:MM:SS time
                    if not isinstance(src_value, str):
                        raise ValueError(_("The descriptor value must be a time string (HH:MM:SS)") + " (%s)" % dmt.get_label())

                    # check format
                    # @todo
                elif format.type == "datetime":
                    # check if the value is an ISO and UTC (convert to UTC if necessary)
                    if not isinstance(src_value, str):
                        raise ValueError(_("The descriptor value must be a datetime string (ISO)") + " (%s)" % dmt.get_label())

                    # check format
                    # @todo
                elif format.type == "numeric":
                    # check if the value is a decimal (string with digits - and .) with the according precision of
                    # decimals
                    if not isinstance(src_value, str):
                        raise ValueError(_("The descriptor value must be a decimal string") + " (%s)" % dmt.get_label())

                    # check format
                    # @todo
                elif format.tpye == "numeric_range":
                    # check if the value is a decimal (string with digits - and .) with the according precision of
                    # decimals and into the range min/max
                    if not isinstance(src_value, str):
                        raise ValueError(_("The descriptor value must be a decimal string") + " (%s)" % dmt.get_label())

                    # check format
                    # @todo

                    # check min/max
                    # @todo
                elif format.type == "string":
                    # check if the value is a string matching the regexp and the max length of 1024 characters
                    if not isinstance(src_value, str):
                        raise ValueError(_("The descriptor value must be a string") + " (%s)" % dmt.get_label())

                    # test max length
                    # @todo

                    # test regexp
                    # @todo

            results[dmt.id] = src_value

    return results
