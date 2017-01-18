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
            'condition',
            'describable',
            'descriptor',
            'descriptormodel',
            'descriptormetamodel',
            'descriptorpanel',
            )
        )

        # defines the list of entities models that uses of a meta-model of descriptor
        self.describable_entities = []

        # different types of format for type of descriptors
        self.format_types = [
            {'group': 'single', 'label': _('Single value'), 'items': [
                {'id': 'boolean', 'label': _('Boolean')},
                {'id': 'numeric', 'label': _('Numeric')},
                {'id': 'numeric_range', 'label': _('Numeric range')},
                {'id': 'ordinal', 'label': _('Ordinal')},
                {'id': 'gps', 'label': _('GPS coordinate')},
                {'id': 'string', 'label': _('Text')},
                {'id': 'date', 'label': _('Date')},
                {'id': 'time', 'label': _('Time')},
                {'id': 'datetime', 'label': _('Date+time')},
                {'id': 'entity', 'label': _('Entity')},
                {'id': 'media', 'label': _('Media')},
                {'id': 'media_collection', 'label': _('Media collection')},
            ]},

            {'group': 'list', 'label': _('List of values'), 'items': [
                {'id': 'enum_single', 'label': _('Single enumeration')},
                {'id': 'enum_pair', 'label': _('Pair enumeration')},
                {'id': 'enum_ordinal', 'label': _('Ordinal with text')}
            ]}
        ]

        # different units of format for type of descriptors
        self.format_units = [
            # @todo
        ]

        # descriptor menu
        menu_descriptor = ModuleMenu('administration', _('Administration'), order=999, auth=AUTH_STAFF)

        # descriptor related menus
        menu_descriptor.add_entry(MenuSeparator(200))
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
