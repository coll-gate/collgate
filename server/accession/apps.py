# -*- coding: utf-8; -*-
#
# @file apps.py
# @brief coll-gate accession module main
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2016-09-01
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

from django.utils.translation import ugettext_lazy as _

from descriptor.descriptormetamodeltype import DescriptorMetaModelTypeManager
from igdectk.common.apphelpers import ApplicationMain
from igdectk.module import AUTH_USER, AUTH_STAFF
from igdectk.module.manager import module_manager
from igdectk.module.menu import MenuEntry, MenuSeparator
from igdectk.module.module import Module, ModuleMenu
from igdectk.bootstrap.glyphs import Glyph
from main.config import configuration


class CollGateAccession(ApplicationMain):
    name = '.'.join(__name__.split('.')[0:-1])

    def __init__(self, app_name, app_module):
        super(CollGateAccession, self).__init__(app_name, app_module)

        # different types of format for type of descriptors for this module
        self.format_types = []

        # different types of format for meta-model of descriptors for this module
        self.meta_model_types = []

    def ready(self):
        super().ready()

        from main.models import main_register_models
        main_register_models(CollGateAccession.name)

        from audit.models import audit_register_models
        audit_register_models(CollGateAccession.name)

        # create a module accession
        accession_module = Module('accession', base_url='coll-gate')
        accession_module.include_urls((
            'base',
            'accessionsynonym',
            'batchaction',
            'accession',
            'accessionbatch',
            'batch',
            'accessionpanel',
            'accessionclassificationentry'
            )
        )

        # add the describable entities models
        from .models import Accession, Batch, Sample, AccessionPanel, BatchPanel

        # descriptor_module
        from django.apps import apps
        descriptor_app = apps.get_app_config('descriptor')
        descriptor_app.describable_entities += [
            Accession,
            Batch,
            Sample,
            AccessionPanel,
            BatchPanel
        ]

        # add the classificationEntry entities models, classification_module
        classification_app = apps.get_app_config('classification')
        classification_app.children_entities += [
            Accession
        ]

        # registers standard format type of descriptors meta-models
        from . import descriptormetamodeltype

        for element in dir(descriptormetamodeltype):
            attr = getattr(descriptormetamodeltype, element)
            if type(attr) is type and descriptormetamodeltype.DescriptorMetaModelType in attr.__bases__:
                self.meta_model_types.append(attr())

        # and register them
        DescriptorMetaModelTypeManager.register(self.meta_model_types)

        # accession menu
        menu_accession = ModuleMenu('accession', _('Accession'), auth=AUTH_USER)

        menu_accession.add_entry(
            MenuEntry('create-accession', _('Create accession'), "~accession/accession/create",
                      icon=Glyph.PLUS_SIGN, order=1))

        menu_accession.add_entry(MenuSeparator(100))
        menu_accession.add_entry(
            MenuEntry('list-accession', _('List accessions'), "#accession/accession/", icon=Glyph.LIST, order=101))
        menu_accession.add_entry(
            MenuEntry('panel-accession', _('Panel accessions'), "#accession/accessions_panel/",
                      icon=Glyph.LIST_ALT, order=102))

        menu_accession.add_entry(MenuSeparator(200))
        menu_accession.add_entry(
            MenuEntry('search-accession', _('Search accessions'), "~accession/accession/search",
                      icon=Glyph.SEARCH, order=201))

        accession_module.add_menu(menu_accession)

        # batch menu
        menu_batch = ModuleMenu('batch', _('Batch'), auth=AUTH_USER)

        menu_batch.add_entry(
            MenuEntry('create-batch', _('Introduce a batch'), "~accession/batch/create",
                      icon=Glyph.PLUS_SIGN, order=1))

        menu_batch.add_entry(MenuSeparator(100))
        menu_batch.add_entry(
            MenuEntry('list-batches', _('List batches'), "#accession/batch/", icon=Glyph.LIST, order=101))
        menu_batch.add_entry(
            MenuEntry('panel-batches', _('Panel batches'), "#accession/batches_panel/",
                      icon=Glyph.LIST_ALT, order=102))

        menu_batch.add_entry(MenuSeparator(200))
        menu_batch.add_entry(
            MenuEntry('search-batch', _('Search batches'), "~accession/batch/search",
                      icon=Glyph.SEARCH, order=201))

        accession_module.add_menu(menu_batch)

        # action menu
        menu_action = ModuleMenu('action', _('Action'), auth=AUTH_USER)

        accession_module.add_menu(menu_action)

        module_manager.register_module(accession_module)

        if self.is_run_mode():
            self.post_ready()

    def post_ready(self):
        from accession import localsettings
        from main.models import EntitySynonymType
        if self.is_table_exists(EntitySynonymType):
            builtins_types = ["accession_name",
                              "accession_code",
                              "accession_alternate_name",
                              "accession_geves_code"]

            if EntitySynonymType.objects.filter(name__in=builtins_types).count() != len(builtins_types):
                configuration.wrong(
                    "accession",
                    "accession_synonym_types",
                    "Missing builtins accession synonym types. Be sure to have installed fixtures.")
            else:
                configuration.validate("accession",
                                       "accession_synonym_types",
                                       "accession synonym types detected.")

                # keep models id in cache
                localsettings.synonym_type_accession_name = EntitySynonymType.objects.get(name="accession_name").pk
                localsettings.synonym_type_accession_code = EntitySynonymType.objects.get(name="accession_code").pk
                localsettings.synonym_type_accession_alternate_name = EntitySynonymType.objects.get(
                    name="accession_alternate_name").pk
                localsettings.synonym_type_accession_geves_code = EntitySynonymType.objects.get(
                    name="accession_geves_code").pk
