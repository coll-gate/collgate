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
from django.core.exceptions import SuspiciousOperation
from django.shortcuts import get_object_or_404
from django.utils.translation import ugettext_lazy as _

from descriptor.descriptorformattype import DescriptorFormatTypeManager

from igdectk.rest import Format, Method
from igdectk.rest.response import HttpResponseRest
from main.cache import cache_manager

from .descriptor import RestDescriptor
from .models import DescriptorMetaModel, DescriptorModelType, DescriptorType


class RestDescriptorColumnsForContentType(RestDescriptor):
    regex = r'^columns/(?P<content_type_name>[a-zA-Z\.-]+)/$'
    name = 'columns'


@RestDescriptorColumnsForContentType.def_auth_request(Method.GET, Format.JSON)
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
    app_label, model_name = content_type_name.split('.')
    content_type = get_object_or_404(ContentType, app_label=app_label, model=model_name)

    dmms_list = request.GET.get('descriptor_meta_models')
    dmms_ids = None

    if dmms_list:
        if type(dmms_list) is not str:
            raise SuspiciousOperation(_('Invalid descriptor meta model list parameter format'))

        dmms_ids = [int(x) for x in dmms_list.split(',')]
        dmms_ids.sort()

        cache_name = cache_manager.make_cache_name(content_type_name, ','.join(map(str, dmms_ids)))
    else:
        cache_name = cache_manager.make_cache_name(content_type_name)

    results = cache_manager.get('_entity_columns', cache_name)

    if results is not None:
        return HttpResponseRest(request, results)

    dmms = DescriptorMetaModel.objects.filter(target=content_type).values_list(
        "descriptor_models__descriptor_model_types__id", flat=True)

    if dmms_ids:
        dmms = dmms.filter(pk__in=dmms_ids)

    dmts = DescriptorModelType.objects.filter(id__in=dmms).prefetch_related('descriptor_type')

    columns = {}

    # add descriptor model type information for each descriptors attached to any meta-model related to the
    # entity model
    for dmt in dmts:
        descriptor_format = dmt.descriptor_type.format
        query = True if DescriptorFormatTypeManager.get(descriptor_format).related_model(descriptor_format) else False

        dft = DescriptorFormatTypeManager.get(descriptor_format)

        # display_fields comes by default from dft is defined
        if dft.display_fields is not None and 'display_fields' not in descriptor_format:
            descriptor_format['display_fields'] = dft.display_fields

        if DescriptorFormatTypeManager.get(descriptor_format).column_display is True:
            columns['#' + dmt.name] = {
                'group': dmt.descriptor_type.group_id,
                'type': dmt.descriptor_type_id,
                'label': dmt.get_label(),
                'query': query,
                'format': descriptor_format,
                'available_operators': dft.available_operators
            }

    # and add standard columns information if the models defines a get_default_columns method
    model_class = content_type.model_class()
    if hasattr(model_class, 'get_defaults_columns'):
        for name, column in model_class.get_defaults_columns().items():
            descriptor_format = column.get('format')

            # get group id and type id from descriptor type code
            code = column.get('code')
            if code:
                descriptor_type = DescriptorType.objects.get(code=code)
                descriptor_type_group_id = descriptor_type.group_id
                descriptor_type_id = descriptor_type.id
            else:
                descriptor_type_group_id = 0
                descriptor_type_id = 0

            columns[name] = {
                'group': descriptor_type_group_id,
                'type': descriptor_type_id,
                'field': column.get('field', None),
                'label': column.get('label', name),
                'query': column.get('query', False),
                'format': descriptor_format,
                'available_operators': column.get('available_operators')
            }

    results = {
        'cacheable': True,
        'validity': None,
        'columns': columns
    }

    # cache for 1 day
    cache_manager.set('_entity_columns', cache_name, results, 60*60*24)

    return HttpResponseRest(request, results)


def get_description(model):
    """
    Returns information about columns for a specified model. All columns of any related meta-models.
    """
    cache_name = cache_manager.make_cache_name('description', '%s.%s' % (model._meta.app_label, model._meta.model_name))
    results = cache_manager.get('_descriptor', cache_name)

    if results is not None:
        return results

    content_type = ContentType.objects.get_by_natural_key(app_label=model._meta.app_label, model=model._meta.model_name)

    dmms = DescriptorMetaModel.objects.filter(target=content_type).values_list(
        "descriptor_models__descriptor_model_types__id", flat=True)
    dmts = DescriptorModelType.objects.filter(id__in=dmms).prefetch_related('descriptor_type')

    results = {}

    for dmt in dmts:
        descriptor_format = dmt.descriptor_type.format
        dft = DescriptorFormatTypeManager.get(descriptor_format)

        results[dmt.name] = {
            'name': dmt.name,
            'model': dmt,
            'index': dmt.index,
            'handler': dft,
            'format': descriptor_format
        }

    # cache for 1 day
    cache_manager.set('_descriptor', cache_name, results, 60*60*24)

    return results
