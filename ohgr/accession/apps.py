# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
ohgr accession module main
"""
# from django.utils.translation import ugettext_noop as _
from django.utils.translation import ugettext_lazy as _

from igdectk.common.apphelpers import ApplicationMain
from igdectk.module import AUTH_USER
from igdectk.module.manager import module_manager
from igdectk.module.menu import MenuEntry, MenuSeparator
from igdectk.module.module import Module, ModuleMenu
from igdectk.bootstrap.glyphs import Glyph


class OhgrAccession(ApplicationMain):
    name = '.'.join(__name__.split('.')[0:-1])

    def ready(self):
        super().ready()

        from audit.models import register_models
        register_models(OhgrAccession.name)

        # create a module accession
        accession_module = Module('accession', base_url='ohgr')
        accession_module.include_urls((
            'base',
            'descriptor',
            )
        )

        # accession menu
        menu_accession = ModuleMenu('accession', _('Accession'), auth=AUTH_USER)
        menu_accession.add_entry(
            MenuEntry('create-accession', _('Create accession'), "~accession/Accession/create",
                      icon=Glyph.PLUS_SIGN, order=1))
        menu_accession.add_entry(
            MenuEntry('create-batch', _('Create batch'), "~accession/Batch/create",
                      icon=Glyph.PLUS_SIGN, order=2))
        menu_accession.add_entry(MenuSeparator(100))
        menu_accession.add_entry(
            MenuEntry('list-accession', _('List accessions'), "#accession/accession/", icon=Glyph.LIST, order=101))
        menu_accession.add_entry(MenuSeparator(200))
        menu_accession.add_entry(
            MenuEntry('list-descriptor-group', _('List groups of descriptors'), "#accession/descriptor/group/", icon=Glyph.LEAF, order=201))
        accession_module.add_menu(menu_accession)

        module_manager.register_menu(accession_module)
