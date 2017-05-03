# -*- coding: utf-8; -*-
#
# @file apps.py
# @brief coll-gate taxonomy module main
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2016-09-01
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

from django.utils.translation import ugettext_lazy as _

from igdectk.common.apphelpers import ApplicationMain
from igdectk.module import AUTH_USER
from igdectk.module.manager import module_manager
from igdectk.module.menu import MenuEntry, MenuSeparator
from igdectk.module.module import Module, ModuleMenu
from igdectk.bootstrap.glyphs import Glyph


class CollGateTaxonomy(ApplicationMain):
    name = '.'.join(__name__.split('.')[0:-1])

    def ready(self):
        super().ready()

        from audit.models import register_models
        register_models(CollGateTaxonomy.name)

        # create a module taxonomy
        taxonomy_module = Module('taxonomy', base_url='coll-gate')
        taxonomy_module.include_urls((
            'base',
            'taxon',
            'taxonsynonym'
            )
        )

        # defines the list of entities models that uses of a taxon as parent
        self.children_entities = []

        # add the describable entities models
        from .models import Taxon

        # descriptor_module
        from django.apps import apps
        descriptor_app = apps.get_app_config('descriptor')
        descriptor_app.describable_entities += [
            Taxon
        ]

        # taxonomy menu
        menu_taxonomy = ModuleMenu('taxonomy', _('Taxonomy'), auth=AUTH_USER)
        menu_taxonomy.add_entry(
            MenuEntry('create-taxon', _('Create taxon'), "~taxonomy/taxon/create", icon=Glyph.PLUS_SIGN, order=1))
        menu_taxonomy.add_entry(
            MenuEntry('create-cultivar', _('Create cultivar'), "~taxonomy/taxon/createCultivar", icon=Glyph.PLUS_SIGN, order=2))
        menu_taxonomy.add_entry(MenuSeparator(100))
        menu_taxonomy.add_entry(
            MenuEntry('list-taxon', _('List taxons'), "#taxonomy/taxon/", icon=Glyph.LIST, order=101))
        menu_taxonomy.add_entry(
            MenuEntry('list-taxon-cultivar', _('List cultivars'), "#taxonomy/taxon/", icon=Glyph.LIST_ALT, order=102))
        taxonomy_module.add_menu(menu_taxonomy)

        module_manager.register_module(taxonomy_module)
