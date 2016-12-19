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


def get_describable_panels(descriptor_meta_model_id, app_label, model):
    """
    Return the structure of panels of descriptors with descriptor models, descriptors model types, descriptor type.
    :deprecated
    :param descriptor_meta_model_id: Unique descriptor metal model identifier
    :param app_label: Application label of the describable model
    :param model: Name of the model of the describable entity
    :return: An array of panel containing a structure of types of descriptors
    """
    content_type = get_object_or_404(ContentType, app_label=app_label, model=model)
    dmm = get_object_or_404(DescriptorMetaModel, id=descriptor_meta_model_id, target=content_type)

    dps = DescriptorPanel.objects.filter(descriptor_meta_model=dmm).order_by('position')
    dps.select_related('descriptor_model')

    panels = []

    for panel in dps:
        descriptor_model = panel.descriptor_model

        dmts = []

        for dmt in descriptor_model.descriptor_model_types.all().order_by('position').select_related('descriptor_type'):
            descriptor_type = dmt.descriptor_type

            # values are loaded on demand (displaying the panel or opening the dropdown)
            format = json.loads(descriptor_type.format)

            conditions = DescriptorModelTypeCondition.objects.filter(descriptor_model_type_id=dmt.id)

            if conditions.exists():
                dmtc = conditions[0]

                condition = {
                    'defined': True,
                    'condition': dmtc.condition,
                    'target': dmtc.target.id,
                    'values': json.loads(dmtc.values)
                }
            else:
                condition = {
                    'defined': False,
                    'condition': 0,
                    'target': 0,
                    'values': None
                }

            dmts.append({
                'id': dmt.id,
                'name': dmt.name,
                'label': dmt.get_label(),
                'condition': condition,
                'mandatory': dmt.mandatory,
                'set_once': dmt.set_once,
                'descriptor_type': {
                    'id': descriptor_type.id,
                    'group': descriptor_type.group_id,
                    'code': descriptor_type.code,
                    'format': format
                }
            })

        panels.append({
            'id': panel.id,
            'position': panel.position,
            'name': panel.name,
            'label': panel.get_label(),
            'descriptor_model': {
                'id': descriptor_model.id,
                'name': descriptor_model.name,
                'descriptor_model_types': dmts
            }
        })

    return panels


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

            if conditions.exists():
                # @todo check condition
                dmtc = conditions[0]

                # 'condition': dmtc.condition,
                # 'target': dmtc.target.id,
                # 'values': json.loads(dmtc.values)

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

            results[dmt.id] = src_value

    return results
