# -*- coding: utf-8; -*-
#
# @file descriptorcolumns.py
# @brief 
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2017-01-03
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details coll-gate descriptor module, descriptor columns

import json

from django.contrib.contenttypes.models import ContentType
from django.shortcuts import get_object_or_404

from descriptor.descriptorformattype import DescriptorFormatTypeManager

from igdectk.rest import Format, Method
from igdectk.rest.response import HttpResponseRest
# from igdectk.common.cache import named_cache_page
from main.cache import cache_manager, named_cache

from .descriptor import RestDescriptor
from .models import DescriptorMetaModel, DescriptorModelType
from .appsettings import EXCLUDED_TYPES_FOR_COLUMN_VIEW


class RestDescriptorColumnsForContentType(RestDescriptor):
    regex = r'^columns/(?P<content_type_name>[a-zA-Z\.-]+)/$'
    name = 'columns'


@RestDescriptorColumnsForContentType.def_auth_request(Method.GET, Format.JSON)
@named_cache('descriptor', '{0}', 5)
def get_columns_name_for_describable_content_type(request, content_type_name):
    """
    According to a specified model, retrieve any meta-models of descriptors, and
    from them, returns any information about theirs related type of models of descriptors.
    Additionally, if the model offers a get_default_columns method, then the returned object will contains
    information returns by this method for the model standard fields.

    For example, a model offering a name field, information about this columns can be defined like a descriptor
    into a dict.

    :param request:
    :param content_type_name: Module.model content type name.
    :return: An array of dict defining all available columns related to this model.
    """
    app_label, model = content_type_name.split('.')
    content_type = get_object_or_404(ContentType, app_label=app_label, model=model)

    meta_model_id_list = request.GET.get('meta_model_list')

    dmms = DescriptorMetaModel.objects.filter(target=content_type).values_list(
        "descriptor_models__descriptor_model_types__id", flat=True)

    if meta_model_id_list:
        dmms = dmms.filter(pk__in=meta_model_id_list.split(','))

    dmts = DescriptorModelType.objects.filter(id__in=dmms).prefetch_related('descriptor_type')

    columns = {}

    # add descriptor model type information for each descriptors attached to any meta-model related to the
    # entity model
    for dmt in dmts:
        descriptor_format = json.loads(dmt.descriptor_type.format)
        query = True if DescriptorFormatTypeManager.get(descriptor_format).related_model(descriptor_format) else False

        if descriptor_format['type'] not in EXCLUDED_TYPES_FOR_COLUMN_VIEW:
            columns['#' + dmt.name] = {
                'group': dmt.descriptor_type.group_id,
                'type': dmt.descriptor_type_id,
                'label': dmt.get_label(),
                'query': query,
                'format': descriptor_format
            }

    # and add standard columns information if the models defines a get_default_columns method
    model_class = content_type.model_class()
    if hasattr(model_class, 'get_defaults_columns'):
        for name, column in model_class.get_defaults_columns().items():
            descriptor_format = column.get('format')

            columns[name] = {
                'group': 0,
                'type': 0,
                'field': column.get('field', None),
                'label': column.get('label', name),
                'query': column.get('query', False),
                'format': descriptor_format
            }

    results = {
        'cacheable': True,
        'columns': columns
    }

    return HttpResponseRest(request, results)


def get_description(model):
    """
    Returns information about columns for a specified model. All columns of any related meta-models.
    """
    cache_name = 'description:%s.%s' % (model._meta.app_label, model._meta.model_name)
    results = cache_manager.content('descriptor', cache_name)

    if results:
        return results

    content_type = get_object_or_404(ContentType, app_label=model._meta.app_label, model=model._meta.model_name)

    dmms = DescriptorMetaModel.objects.filter(target=content_type).values_list(
        "descriptor_models__descriptor_model_types__id", flat=True)
    dmts = DescriptorModelType.objects.filter(id__in=dmms).prefetch_related('descriptor_type')

    results = {}

    for dmt in dmts:
        descriptor_format = json.loads(dmt.descriptor_type.format)
        dft = DescriptorFormatTypeManager.get(descriptor_format)

        results[dmt.name] = {
            'name': dmt.name,
            'model': dmt,
            'index': dmt.index,
            'handler': dft,
            'format': descriptor_format
        }

    # cache only for 5 seconds
    cache_manager.set('descriptor', cache_name, 5).content = results

    return results
