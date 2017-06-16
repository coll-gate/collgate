# -*- coding: utf-8; -*-
#
# @file describable.py
# @brief coll-gate descriptor module, descriptor
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2016-09-01
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

import json

from django.contrib.contenttypes.models import ContentType
from django.shortcuts import get_object_or_404
from django.views.decorators.cache import cache_page
from django.utils.translation import ugettext_lazy as _

from descriptor.descriptorformattype import DescriptorFormatTypeManager
from descriptor.models import DescriptorPanel, DescriptorModelTypeCondition
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


class DescriptorsBuilder(object):

    def __init__(self, entity):
        self.entity = entity
        self.own_list = []
        self._descriptors = {}

    @property
    def descriptors(self):
        """
        Descriptors dict accessor.
        :return: A dict of updated descriptors values
        """
        return self._descriptors

    def clear(self, descriptor_meta_model):
        """
        Clear (unset) any values of descriptors. It does not take care of mandatory or set_once attributes.
        The descriptors dict of the builder returns an empty dict. It does not also take care of the conditions because
        there is no new values. And it make the list of descriptors to be released by a next call of
        update_associations.

        Very important, any previously owned entities must be released by a call to update_associations.

        :param descriptor_meta_model:
        """
        dps = DescriptorPanel.objects.filter(descriptor_meta_model=descriptor_meta_model).order_by('position')
        dps.select_related('descriptor_model')

        for panel in dps:
            descriptor_model = panel.descriptor_model

            for dmt in descriptor_model.descriptor_model_types.all().order_by('position').select_related(
                    'descriptor_type'):
                descriptor_type = dmt.descriptor_type

                # values are loaded on demand (displaying the panel or opening the dropdown)
                dt_format = json.loads(descriptor_type.format)

                src_name = str(dmt.name)

                acc_value = self.entity.descriptors.get(src_name)

                if DescriptorFormatTypeManager.has_external(dt_format):
                    self.own_list.append((dt_format, acc_value, None))

        # no more values
        self._descriptors = {}

    def check_and_update(self, descriptor_meta_model, descriptors):
        """
        For any descriptors (model-type) of the meta-model, check the new values given by the descriptors parameter,
        check the mandatory, the set_once and the condition. It also make the list of descriptors to be updated by
        a next call of update_associations.

        The descriptors values are then available in the property descriptors of the builder.

        Very important, it is necessary to make a call to update_associations in way to release any previously used
        externals entities, and to own the newly associated.

        :param descriptor_meta_model: Descriptor meta model
        :param descriptors: New descriptors values
        """
        dps = DescriptorPanel.objects.filter(descriptor_meta_model=descriptor_meta_model).order_by('position')
        dps.select_related('descriptor_model')

        for panel in dps:
            descriptor_model = panel.descriptor_model

            for dmt in descriptor_model.descriptor_model_types.all().order_by('position').select_related('descriptor_type'):
                descriptor_type = dmt.descriptor_type

                # values are loaded on demand (displaying the panel or opening the dropdown)
                dt_format = json.loads(descriptor_type.format)

                conditions = DescriptorModelTypeCondition.objects.filter(descriptor_model_type_id=dmt.id)
                src_name = dmt.name

                src_defined = src_name in descriptors

                acc_value = self.entity.descriptors.get(src_name)
                src_value = descriptors.get(src_name)

                merged_value = src_value if src_defined else acc_value

                # valid the new value
                if src_defined and src_value is not None:
                    DescriptorFormatTypeManager.validate(dt_format, src_value, dmt)

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
                    target_name = dmtc.target.name

                    # according to the condition if the current value is defined (src) or was defined (acc)
                    # the condition must be respected otherwise it raises an exception if a new value is defined (src)
                    src_target_defined = target_name in descriptors

                    acc_target_value = self.entity.descriptors.get(target_name)
                    src_target_value = descriptors.get(target_name)
                    merged_target_value = src_target_value if src_target_defined else acc_target_value

                    if dmtc.condition == 0:
                        # the src_value can be defined if the target_value is not defined
                        if merged_target_value is not None and merged_value is not None:
                            raise ValueError(_("A conditional descriptor is defined but the condition is not true") +
                                             " (%s)" % dmt.get_label())

                    elif dmtc.condition == 1:
                        # the src_value can be defined if the target_value is defined
                        if merged_target_value is None and merged_value is not None:
                            raise ValueError(_("A conditional descriptor is defined but the condition is not true") +
                                             " (%s)" % dmt.get_label())

                    elif dmtc.condition == 2:
                        # the src_value can defined if the target_value is defined and is equal to the value defined by
                        # the condition

                        # first the target_value must be defined
                        if merged_target_value is None and merged_value is not None:
                            raise ValueError(_("A conditional descriptor is defined but the condition is not true") +
                                             " (%s)" % dmt.get_label())

                        values = json.loads(dmtc.values)

                        # and be equal to
                        if merged_value is not None and merged_target_value is not None and merged_target_value != values:
                            raise ValueError(_("A conditional descriptor is defined but the condition is not true") +
                                             " (%s)" % dmt.get_label())

                    elif dmtc.condition == 3:
                        # the src_value can defined if the target_value is defined and is different from the value
                        # defined by the condition

                        # first the target_value must be defined
                        if merged_target_value is None and merged_value is not None:
                            raise ValueError(
                                _("A conditional descriptor is defined but the condition is not true") +
                                " (%s)" % dmt.get_label())

                        values = json.loads(dmtc.values)

                        # and be different from
                        if merged_value is not None and merged_target_value is not None and merged_target_value == values:
                            raise ValueError(
                                _("A conditional descriptor is defined but the condition is not true") +
                                " (%s)" % dmt.get_label())

                # use new value if defined, else reuse current
                self._descriptors[dmt.name] = src_value if src_defined else acc_value

                # make the list of descriptors that need to perform a call to own
                if DescriptorFormatTypeManager.has_external(dt_format):
                    self.own_list.append((dt_format, acc_value, merged_value))

    def update_associations(self):
        """
        Update the owner of each external descriptor. It must be called after each clear or check_and_update in way
        to update the owner of each previously associated entity.
        """
        for dt_format, old_value, new_value in self.own_list:
            DescriptorFormatTypeManager.own(dt_format, self.entity, old_value, new_value)
