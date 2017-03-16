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
            'accessionsynonym',
            'batchaction',
            'accession',
            'accessionbatch',
            'batch'
            )
        )

        # add the describable entities models
        from .models import Accession, Batch, Sample

        # descriptor_module
        from django.apps import apps
        descriptor_app = apps.get_app_config('descriptor')
        descriptor_app.describable_entities += [
            Accession,
            Batch,
            Sample
        ]

        # add the taxon entities models, taxonomy_module
        taxonomy_app = apps.get_app_config('taxonomy')
        taxonomy_app.children_entities += [
            Accession
        ]

        # accession menu
        menu_accession = ModuleMenu('accession', _('Accession'), auth=AUTH_USER)

        menu_accession.add_entry(
            MenuEntry('create-accession', _('Create accession'), "~accession/accession/create",
                      icon=Glyph.GRAIN, order=1))
        menu_accession.add_entry(
            MenuEntry('create-batch', _('Create batch'), "~accession/batch/create",
                      icon=Glyph.LEAF, order=2))

        menu_accession.add_entry(MenuSeparator(100))
        menu_accession.add_entry(
            MenuEntry('list-accession', _('List accessions'), "#accession/accession/", icon=Glyph.LIST, order=101))

        menu_accession.add_entry(MenuSeparator(200))
        menu_accession.add_entry(
            MenuEntry('search-accession', _('Search accessions'), "#accession/accession/search/",
                      icon=Glyph.SEARCH, order=201))

        accession_module.add_menu(menu_accession)

        module_manager.register_module(accession_module)
