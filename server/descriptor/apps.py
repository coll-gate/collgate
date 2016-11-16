# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
coll-gate descriptor module main
"""

from django.utils.translation import ugettext_lazy as _

from igdectk.common.apphelpers import ApplicationMain
from igdectk.module import AUTH_USER, AUTH_STAFF
from igdectk.module.manager import module_manager
from igdectk.module.menu import MenuEntry, MenuSeparator
from igdectk.module.module import Module, ModuleMenu
from igdectk.bootstrap.glyphs import Glyph


class CollGateDescriptor(ApplicationMain):
    name = '.'.join(__name__.split('.')[0:-1])

    def ready(self):
        super().ready()

        from audit.models import register_models
        register_models(CollGateDescriptor.name)

        # create a module accession
        descriptor_module = Module('descriptor', base_url='coll-gate')
        descriptor_module.include_urls((
            'descriptor',
            'descriptormodel',
            'descriptormetamodel',
            'descriptorpanel',
            )
        )

        # defines the list of entities models that uses of a meta-model of descriptor
        self.describable_entities = []

        # descriptor menu
        menu_descriptor = ModuleMenu('descriptor', _('Descriptor'), order=100, auth=AUTH_STAFF)

        # descriptor related menus
        menu_descriptor.add_entry(
            MenuEntry('list-descriptor-group', _('List groups of descriptors'), "#descriptor/group/",
                      icon=Glyph.TH_LIST, order=201, auth=AUTH_STAFF))
        menu_descriptor.add_entry(
            MenuEntry('list-descriptor-model', _('List models of descriptor'), "#descriptor/model/",
                      icon=Glyph.TH, order=202, auth=AUTH_STAFF))
        menu_descriptor.add_entry(
            MenuEntry('list-descriptor-meta-model', _('List meta-models of descriptor'), "#descriptor/meta-model/",
                      icon=Glyph.TH_LARGE, order=203, auth=AUTH_STAFF))
        descriptor_module.add_menu(menu_descriptor)

        module_manager.register_menu(descriptor_module)
