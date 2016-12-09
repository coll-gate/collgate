# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
coll-gate accession rest handler
"""
from django.contrib.contenttypes.models import ContentType
from django.shortcuts import get_object_or_404
from django.utils import translation

from descriptor.models import DescriptorMetaModel, DescriptorPanel
from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest

from .models import Accession, AccessionSynonym
from .accession import RestAccessionAccession

from django.utils.translation import ugettext_lazy as _


class RestAccessionCreate(RestAccessionAccession):
    regex = r'^create/(?P<mm_id>[0-9]+)/$'
    name = 'create'


@RestAccessionCreate.def_auth_request(Method.GET, Format.JSON,
    perms={
        'accession.add_accession': _("You are not allowed to create an accession"),
    }
)
def get_create_accession_panels(request, mm_id):
    dmm_id = int(mm_id)

    content_type = get_object_or_404(ContentType, app_label="accession", model="accession")
    dmm = get_object_or_404(DescriptorMetaModel, id=dmm_id, target=content_type)

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

            dmts.append({
                'id': dmt.id,
                'name': dmt.name,
                'label': dmt.get_label(),
                'descriptor_type': {
                    'id': descriptor_type.id,
                    'group': descriptor_type.group_id,
                    'code': descriptor_type.code,
                    'format': format,
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

    results = {
        'panels': panels
    }

    return HttpResponseRest(request, results)
