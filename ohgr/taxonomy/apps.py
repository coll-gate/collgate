# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
ohgr taxonomy module main
"""
# from django.utils.translation import ugettext_noop as _
from django.utils.translation import ugettext_lazy as _

from igdectk.common.apphelpers import ApplicationMain
from igdectk.module import AUTH_USER
from igdectk.module.manager import module_manager
from igdectk.module.menu import MenuEntry, MenuSeparator
from igdectk.module.module import Module, ModuleMenu
from igdectk.bootstrap.glyphs import Glyph


class OhgrTaxonomy(ApplicationMain):
    name = '.'.join(__name__.split('.')[0:-1])

    def ready(self):
        super().ready()

        from audit.models import register_models
        register_models(OhgrTaxonomy.name)

        # create a module taxonomy
        taxonomy_module = Module('taxonomy', base_url='ohgr')
        taxonomy_module.include_urls((
            'base',
            'taxon',
            'taxonsynonym',
            'addtaxon')
        )

        # taxonomy menu
        menu_taxonomy = ModuleMenu('taxonomy', _('Taxonomy'), auth=AUTH_USER)
        menu_taxonomy.add_entry(
            MenuEntry('create-taxon', _('Create taxon'), "~taxonomy/taxon/create", icon=Glyph.PLUS_SIGN, order=1))
        menu_taxonomy.add_entry(MenuSeparator(100))
        menu_taxonomy.add_entry(
            MenuEntry('list-taxon', _('List taxons'), "#taxonomy/", icon=Glyph.LIST, order=101))
        taxonomy_module.add_menu(menu_taxonomy)

        module_manager.register_menu(taxonomy_module)
