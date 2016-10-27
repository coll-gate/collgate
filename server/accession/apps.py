# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
coll-gate accession module main
"""

from django.utils.translation import ugettext_lazy as _

from igdectk.common.apphelpers import ApplicationMain
from igdectk.module import AUTH_USER, AUTH_STAFF
from igdectk.module.manager import module_manager
from igdectk.module.menu import MenuEntry, MenuSeparator
from igdectk.module.module import Module, ModuleMenu
from igdectk.bootstrap.glyphs import Glyph


class CollGateAccession(ApplicationMain):
    name = '.'.join(__name__.split('.')[0:-1])

    def ready(self):
        super().ready()

        from audit.models import register_models
        register_models(CollGateAccession.name)

        # create a module accession
        accession_module = Module('accession', base_url='coll-gate')
        accession_module.include_urls((
            'base',
            'descriptor',
            'descriptormodel',
            'descriptormetamodel',
            'descriptorpanel',
            )
        )

        # accession menu
        menu_accession = ModuleMenu('accession', _('Accession'), auth=AUTH_USER)
        menu_accession.add_entry(
            MenuEntry('create-accession', _('Create accession'), "~accession/Accession/create",
                      icon=Glyph.GRAIN, order=1))
        menu_accession.add_entry(
            MenuEntry('create-batch', _('Create batch'), "~accession/Batch/create",
                      icon=Glyph.LEAF, order=2))
        menu_accession.add_entry(MenuSeparator(100))
        menu_accession.add_entry(
            MenuEntry('list-accession', _('List accessions'), "#accession/accession/", icon=Glyph.LIST, order=101))

        # descriptor related menus
        menu_accession.add_entry(MenuSeparator(200, auth=AUTH_STAFF))
        menu_accession.add_entry(
            MenuEntry('list-descriptor-group', _('List groups of descriptors'), "#accession/descriptor/group/",
                      icon=Glyph.TH_LIST, order=201, auth=AUTH_STAFF))
        menu_accession.add_entry(
            MenuEntry('list-descriptor-model', _('List models of descriptor'), "#accession/descriptor/model/",
                      icon=Glyph.TH, order=202, auth=AUTH_STAFF))
        menu_accession.add_entry(
            MenuEntry('list-descriptor-meta-model', _('List meta-models of descriptor'), "#accession/descriptor/meta-model/",
                      icon=Glyph.TH_LARGE, order=203, auth=AUTH_STAFF))
        accession_module.add_menu(menu_accession)

        module_manager.register_menu(accession_module)
