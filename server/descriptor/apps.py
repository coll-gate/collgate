# -*- coding: utf-8; -*-
#
# @file apps.py
# @brief coll-gate descriptor module main
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2016-09-01
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

from django.utils.translation import ugettext_lazy as _

from igdectk.common.apphelpers import ApplicationMain
from igdectk.module import AUTH_STAFF
from igdectk.module.manager import module_manager
from igdectk.module.menu import MenuEntry, MenuSeparator
from igdectk.module.module import Module, ModuleMenu
from igdectk.bootstrap.customglyph import FaGlyph


class CollGateDescriptor(ApplicationMain):
    name = '.'.join(__name__.split('.')[0:-1])

    def __init__(self, app_name, app_module):
        super(CollGateDescriptor, self).__init__(app_name, app_module)

        # defines the list of entities models that uses of a meta-model of descriptor
        self.describable_entities = []

        # different types of format for type of descriptors for this module
        self.format_types = []

        # different units of format for type of descriptors
        self.format_units = []

        # different types of meta-model of descriptors for this module
        self.meta_model_types = []

    def ready(self):
        super().ready()

        # register descriptor cache category
        from main.cache import cache_manager
        cache_manager.register('descriptor')
        cache_manager.register('entity_columns')

        from messenger.cache import client_cache_manager
        client_cache_manager.register('descriptors')
        client_cache_manager.register('entity_columns')

        from main.models import main_register_models
        main_register_models(CollGateDescriptor.name)

        from audit.models import audit_register_models
        audit_register_models(CollGateDescriptor.name)

        # create a module accession
        descriptor_module = Module('descriptor', base_url='coll-gate')
        descriptor_module.include_urls((
            'descriptorformat',
            'condition',
            'describable',
            'descriptor',
            'descriptormodel',
            'descriptormetamodel',
            'descriptorcolumns',
            'descriptormetamodelparameters'
            )
        )

        # registers standard types of formats
        from . import descriptorformattype

        self.format_types += [
            descriptorformattype.DescriptorFormatTypeBoolean(),
            descriptorformattype.DescriptorFormatTypeNumeric(),
            descriptorformattype.DescriptorFormatTypeNumericRange(),
            descriptorformattype.DescriptorFormatTypeOrdinal(),
            descriptorformattype.DescriptorFormatTypeString(),
            descriptorformattype.DescriptorFormatTypeDate(),
            descriptorformattype.DescriptorFormatTypeImpreciseDate(),
            descriptorformattype.DescriptorFormatTypeTime(),
            descriptorformattype.DescriptorFormatTypeDateTime(),
            descriptorformattype.DescriptorFormatTypeEntity(),
            descriptorformattype.DescriptorFormatTypeEnumSingle(),
            descriptorformattype.DescriptorFormatTypeEnumPair(),
            descriptorformattype.DescriptorFormatTypeEnumOrdinal()
        ]

        # and register them
        descriptorformattype.DescriptorFormatTypeManager.register(self.format_types)

        # registers standard units
        from . import descriptorformatunit

        for element in dir(descriptorformatunit):
            attr = getattr(descriptorformatunit, element)
            if type(attr) is type and descriptorformatunit.DescriptorFormatUnit in attr.__bases__:
                self.format_units.append(attr())

        # and register them
        descriptorformatunit.DescriptorFormatUnitManager.register(self.format_units)

        # registers standard types of descriptors meta-models
        from . import descriptormetamodeltype

        for element in dir(descriptormetamodeltype):
            attr = getattr(descriptormetamodeltype, element)
            if type(attr) is type and descriptormetamodeltype.DescriptorMetaModelType in attr.__bases__:
                self.meta_model_types.append(attr())

        # and register them
        descriptormetamodeltype.DescriptorMetaModelTypeManager.register(self.meta_model_types)

        # descriptor menu
        menu_descriptor = ModuleMenu('administration', _('Administration'), order=999, auth=AUTH_STAFF)

        # descriptor related menus
        menu_descriptor.add_entry(MenuSeparator(300))
        menu_descriptor.add_entry(
            MenuEntry('list-descriptor-group', _('List groups of descriptors'), "#descriptor/group/",
                      icon=FaGlyph('th-list'), order=301, auth=AUTH_STAFF))
        menu_descriptor.add_entry(
            MenuEntry('list-descriptor-model', _('List models of descriptor'), "#descriptor/model/",
                      icon=FaGlyph('th'), order=302, auth=AUTH_STAFF))
        menu_descriptor.add_entry(
            MenuEntry('list-descriptor-meta-model', _('List meta-models of descriptor'), "#descriptor/meta-model/",
                      icon=FaGlyph('th-large'), order=303, auth=AUTH_STAFF))
        descriptor_module.add_menu(menu_descriptor)

        module_manager.register_module(descriptor_module)
