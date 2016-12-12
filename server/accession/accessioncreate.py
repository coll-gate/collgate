# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
coll-gate accession rest handler
"""
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import SuspiciousOperation
from django.shortcuts import get_object_or_404
from django.utils.translation import ugettext_lazy as _

from accession.models import AccessionSynonym
from descriptor.models import DescriptorMetaModel, DescriptorPanel, DescriptorModelTypeCondition, DescriptorModelType
from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest
from taxonomy.models import Taxon
from .accession import RestAccessionAccession


class RestAccessionCreate(RestAccessionAccession):
    regex = r'^create/(?P<mm_id>[0-9]+)/$'
    name = 'create'


@RestAccessionCreate.def_auth_request(Method.GET, Format.JSON, parameters=('name', 'parent'),
    perms={
        'accession.add_accession': _("You are not allowed to create an accession"),
    }
)
def get_create_accession_panels(request, mm_id):
    dmm_id = int(mm_id)

    name = request.GET['name']
    taxon_id = int(request.GET['parent'])

    if not isinstance(name, str) or len(name) > 64 or len(name) < 3:
        raise SuspiciousOperation(_('The name of the accession must have between 3 and 64 characters'))

    # check uniqueness of the name
    if AccessionSynonym.objects.filter(name=name).exists():
        raise SuspiciousOperation(_('This name of accession is already used'))

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

    taxon = get_object_or_404(Taxon, id=taxon_id)

    parents = []
    next_parent = taxon.parent
    break_count = 0
    while break_count < 10 and next_parent is not None:
        parents.append({
            'id': next_parent.id,
            'name': next_parent.name,
            'rank': next_parent.rank,
            'parent': next_parent.parent_id
        })
        next_parent = next_parent.parent

    results = {
        'name': name,
        'panels': panels,
        'parent': taxon.id,
        'parent_list': [int(x) for x in taxon.parent_list.rstrip(',').split(',')] if taxon.parent_list else [],
        'parent_details': parents,
    }

    return HttpResponseRest(request, results)
