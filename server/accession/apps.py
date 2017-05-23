# -*- coding: utf-8; -*-
#
# @file apps.py
# @brief 
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2016-09-01
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

"""
coll-gate accession module main
"""
import sys
from django.utils.translation import ugettext_lazy as _

from igdectk.common.apphelpers import ApplicationMain
from igdectk.module import AUTH_USER, AUTH_STAFF
from igdectk.module.manager import module_manager
from igdectk.module.menu import MenuEntry, MenuSeparator
from igdectk.module.module import Module, ModuleMenu
from igdectk.bootstrap.glyphs import Glyph
from main.config import configuration


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

        # add the taxon entities models, classification_module
        classification_app = apps.get_app_config('classification')
        classification_app.children_entities += [
            Accession
        ]

        # accession menu
        menu_accession = ModuleMenu('accession', _('Accession'), auth=AUTH_USER)

        menu_accession.add_entry(
            MenuEntry('create-accession', _('Create accession'), "~accession/accession/create",
                      icon=Glyph.GRAIN, order=1))

        menu_accession.add_entry(MenuSeparator(100))
        menu_accession.add_entry(
            MenuEntry('list-accession', _('List accessions'), "#accession/accession/", icon=Glyph.LIST, order=101))

        menu_accession.add_entry(MenuSeparator(200))
        menu_accession.add_entry(
            MenuEntry('search-accession', _('Search accessions'), "~accession/accession/search",
                      icon=Glyph.SEARCH, order=201))

        accession_module.add_menu(menu_accession)

        # batch menu
        menu_batch = ModuleMenu('batch', _('Batch'), auth=AUTH_USER)

        accession_module.add_menu(menu_batch)

        # action menu
        menu_action = ModuleMenu('action', _('Action'), auth=AUTH_USER)

        accession_module.add_menu(menu_action)

        module_manager.register_module(accession_module)

        command_list = ("init_fixtures", "migrate", "makemigrations", "help", "")
        post_ready = True

        for command in command_list:
            if command in sys.argv:
                post_ready = False
                break

        if post_ready:
            self.post_ready()

    def post_ready(self):
        from descriptor.models import DescriptorType

        if not DescriptorType.objects.filter(name="accession_synonym_types").exists():
            configuration.wrong(
                "accession",
                "accession_synonym_types descriptor type",
                "Missing accession_synonym_types descriptor type. Be sure to have installed fixtures.")
        else:
            configuration.validate("accession",
                                   "accession_synonym_types descriptor type",
                                   "accession_synonym_types descriptor type detected.")

