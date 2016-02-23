# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
ohgr taxonomy module main
"""
from django.utils.translation import ugettext_noop

from igdectk.common.apphelpers import ApplicationMain
from igdectk.module import AUTH_USER
from igdectk.module.manager import module_manager
from igdectk.module.menu import MenuEntry, MenuSeparator
from igdectk.module.module import Module, ModuleMenu
from igdectk.bootstrap.glyphs import Glyph


_ = ugettext_noop  # ugettext


class OhgrTaxonomy(ApplicationMain):
    name = '.'.join(__name__.split('.')[0:-1])

    def ready(self):
        super().ready()

        # import module containing REST handlers
        from . import base
        from . import addtaxon

        # create a module taxonomy
        taxonomy_module = Module('taxonomy', base_url='ohgr')

        # taxonomy menu
        menu_taxonomy = ModuleMenu('taxonomy', _('Taxonomy'), auth=AUTH_USER)
        menu_taxonomy.add_entry(MenuSeparator(100))
        taxonomy_module.add_menu(menu_taxonomy)

        module_manager.register_module(taxonomy_module)

        from igdectk.rest.handler import RestHandler
        RestHandler.register_urls()
