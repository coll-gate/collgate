# -*- coding: utf-8; -*-
#
# @file descriptorcolumns.py
# @brief 
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2017-01-03
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

"""
coll-gate descriptor module, descriptor columns
"""
import json

from django.contrib.contenttypes.models import ContentType
from django.shortcuts import get_object_or_404

from descriptor.descriptorformattype import DescriptorFormatTypeManager
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

    dmms = DescriptorMetaModel.objects.filter(target=content_type).values_list(
        "descriptor_models__descriptor_model_types__id", flat=True)
    dmts = DescriptorModelType.objects.filter(id__in=dmms).prefetch_related('descriptor_type')

    columns = {}

    for dmt in dmts:
        descriptor_format = json.loads(dmt.descriptor_type.format)
        query = DescriptorFormatTypeManager.is_value_code(descriptor_format)

        columns[dmt.name] = {
            'label': dmt.get_label(),
            'query': query,
            'format': descriptor_format
        }

    results = {
        'cacheable': True,
        'columns': columns
    }

    return HttpResponseRest(request, results)

