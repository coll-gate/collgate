# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
coll-gate accession rest handler
"""
from django.contrib.contenttypes.models import ContentType
from django.shortcuts import get_object_or_404

from descriptor.models import DescriptorMetaModel
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
        'accession.add_accession', _("You are not allowed to create an accession"),
    }
)
def get_create_accession_panels(request, mm_id):
    dmm_id = int(mm_id)

    content_type = get_object_or_404(ContentType, app_label="accession", model="accession")
    dmm = get_object_or_404(DescriptorMetaModel, id=dmm_id, target=content_type)

    # @todo setup all the panels with descriptors, defaults values and preloaded lists of values
    results = {

    }

    return HttpResponseRest(request, results)
