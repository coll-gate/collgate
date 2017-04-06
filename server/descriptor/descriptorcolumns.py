# -*- coding: utf-8; -*-
#
# Copyright (c) 2017 INRA UMR1095 GDEC

"""
coll-gate descriptor module, descriptor columns
"""

from django.contrib.contenttypes.models import ContentType
from django.shortcuts import get_object_or_404

from igdectk.rest import Format, Method
from igdectk.rest.response import HttpResponseRest
from .descriptor import RestDescriptor
from .models import DescriptorMetaModel, DescriptorModelType


class RestDescriptorColumnsForContentType(RestDescriptor):
    regex = r'^columns/(?P<content_type_name>[a-zA-Z\.-]+)/$'
    name = 'columns'


@RestDescriptorColumnsForContentType.def_auth_request(Method.GET, Format.JSON)
def get_columns_name_for_describable_content_type(request, content_type_name):
    app_label, model = content_type_name.split('.')
    content_type = get_object_or_404(ContentType, app_label=app_label, model=model)

    # dmms = DescriptorMetaModel.objects.filter(target=content_type).prefetch_related(Prefetch(
    #     "descriptor_models",
    #     queryset=DescriptorModel.objects.all().prefetch_related("descriptor_model_types")
    # ))

    dmms = DescriptorMetaModel.objects.filter(target=content_type).values_list(
        "descriptor_models__descriptor_model_types__id", flat=True)
    dmts = DescriptorModelType.objects.filter(id__in=dmms)

    # @todo get query flag

    columns = {}

    for dmt in dmts:
        columns[dmt.name] = {
            'label': dmt.get_label(),
            'query': False  # @todo
        }

    results = {
        'cacheable': True,
        'columns': columns
    }

    return HttpResponseRest(request, results)
