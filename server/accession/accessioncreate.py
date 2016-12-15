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
from descriptor.describable import get_describable_panels
from descriptor.models import DescriptorMetaModel, DescriptorPanel
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

    panels = get_describable_panels(dmm_id, "accession", "accession")
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
