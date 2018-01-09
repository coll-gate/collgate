# -*- coding: utf-8; -*-
#
# @file descriptorcolumns.py
# @brief
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2017-01-03
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details coll-gate descriptor module, descriptor columns

from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import SuspiciousOperation
from django.shortcuts import get_object_or_404
from django.utils.translation import ugettext_lazy as _
from descriptor.descriptorformattype import DescriptorFormatTypeManager
from igdectk.rest import Format, Method
from igdectk.rest.response import HttpResponseRest
from main.cache import cache_manager
from .descriptor import RestDescriptor

# from .models import Layout, DescriptorModelType, Descriptor
from .models import Layout, Descriptor


class RestDescriptorColumnsForContentType(RestDescriptor):
    regex = r'^columns/(?P<content_type_name>[a-zA-Z\.-]+)/$'
    name = 'columns'


@RestDescriptorColumnsForContentType.def_auth_request(Method.GET, Format.JSON)
def get_columns_name_for_describable_content_type(request, content_type_name):
    """
    todo: modify this old description
    According to a specified model, retrieve any layouts of descriptors, and
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

    layouts_list = request.GET.get('layouts')
    mode = request.GET.get('mode')  # define the context, for example: in "search" mode some columns are not display
    layouts_ids = None

    if layouts_list:
        if type(layouts_list) is not str:
            raise SuspiciousOperation(_('Invalid layout list parameter format'))

        layouts_ids = [int(x) for x in layouts_list.split(',')]
        layouts_ids.sort()

        if mode == 'search':
            cache_name = cache_manager.make_cache_name(content_type_name, ','.join(map(str, layouts_ids)), mode)
        else:
            cache_name = cache_manager.make_cache_name(content_type_name, ','.join(map(str, layouts_ids)))

    else:
        if mode == 'search':
            cache_name = cache_manager.make_cache_name(content_type_name, mode)
        else:
            cache_name = cache_manager.make_cache_name(content_type_name)

    results = cache_manager.get('entity_columns', cache_name)

    if results is not None:
        return HttpResponseRest(request, results)

    layouts = Layout.objects.filter(target=content_type)

    if layouts_ids:
        layouts = layouts.filter(pk__in=layouts_ids)

    columns = {}

    # add descriptor model type information for each descriptors attached to any layout related to the
    # entity model

    for layout in layouts:
        for panel in layout.layout_content.get('panels'):
            for descriptor in panel.get('descriptors'):
                descriptor = Descriptor.objects.get(name=descriptor.get('name'))
                dft = DescriptorFormatTypeManager.get(descriptor.format)

                query = True if dft.related_model(descriptor.format) else False

                # display_fields comes by default from dft is defined
                if dft.display_fields is not None and 'display_fields' not in descriptor.format:
                    descriptor.format['display_fields'] = dft.display_fields

                if (dft.column_display is True and not mode) or (dft.search_display is True and mode == 'search'):
                    columns['#' + descriptor.name] = {
                        'group_name': descriptor.group_name,
                        'label': descriptor.get_label(),
                        'query': query,
                        'format': descriptor.format,
                        'available_operators': dft.available_operators
                    }

    # for dmt in dmts:
    #     descriptor_format = dmt.descriptor_type.format
    #     dft = DescriptorFormatTypeManager.get(descriptor_format)
    #
    #     query = True if dft.related_model(descriptor_format) else False
    #
    #     # display_fields comes by default from dft is defined
    #     if dft.display_fields is not None and 'display_fields' not in descriptor_format:
    #         descriptor_format['display_fields'] = dft.display_fields
    #
    #     if (dft.column_display is True and not mode) or (dft.search_display is True and mode == 'search'):
    #         columns['#' + dmt.name] = {
    #             'group': dmt.descriptor_type.group_id,
    #             'type': dmt.descriptor_type_id,
    #             'label': dmt.get_label(),
    #             'query': query,
    #             'format': descriptor_format,
    #             'available_operators': dft.available_operators
    #         }

    # and add standard columns information if the models defines a get_default_columns method
    model_class = content_type.model_class()
    if hasattr(model_class, 'get_defaults_columns'):
        for name, column in model_class.get_defaults_columns().items():
            descriptor_format = column.get('format')
            descriptor_group_name = column.get('group_name', None)

            # get group id and type id from descriptor type code
            code = column.get('code')
            if code:
                descriptor = Descriptor.objects.get(code=code)

            # if column.get('column_display', True):
            if (column.get('column_display', True) and not mode) or (
                        column.get('search_display', True) and mode == 'search'):
                columns[name] = {
                    'group_name': descriptor_group_name,
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
    cache_manager.set('entity_columns', cache_name, results, 60*60*24)

    return HttpResponseRest(request, results)


def get_description(model):
    """
    Returns information about columns for a specified model. All columns of any related layouts.
    """

    cache_name = cache_manager.make_cache_name('description', '%s.%s' % (model._meta.app_label, model._meta.model_name))
    results = cache_manager.get('descriptor', cache_name)

    if results is not None:
        return results

    content_type = ContentType.objects.get_by_natural_key(app_label=model._meta.app_label, model=model._meta.model_name)

    # layouts = Layout.objects.filter(target=content_type).values_list(
    #     "descriptor_models__descriptor_model_types__id", flat=True)
    # dmts = DescriptorModelType.objects.filter(id__in=layouts).prefetch_related('descriptor_type')

    layouts = Layout.objects.filter(target=content_type)

    results = {}

    for layout in layouts:
        for panel in layout.layout_content.get('panels'):
            for descriptor in panel.get('descriptors'):
                descriptor = Descriptor.objects.get(name=descriptor.get('name'))
                dft = DescriptorFormatTypeManager.get(descriptor.format)
                results[descriptor.name] = {
                    'name': descriptor.name,
                    'label': descriptor.get_label(),
                    # 'index': descriptor.index,
                    'handler': dft,
                    'format': descriptor.format
                }

    # for dmt in dmts:
    #     descriptor_format = dmt.descriptor_type.format
    #     dft = DescriptorFormatTypeManager.get(descriptor_format)
    #
    #     results[dmt.name] = {
    #         'name': dmt.name,
    #         'model': dmt,
    #         'index': dmt.index,
    #         'handler': dft,
    #         'format': descriptor_format
    #     }

    # cache for 1 day
    cache_manager.set('descriptor', cache_name, results, 60 * 60 * 24)

    return results
