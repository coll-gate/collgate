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

from descriptor.layouttype import LayoutTypeManager
from igdectk.common.apphelpers import ApplicationMain
from igdectk.module import AUTH_USER, AUTH_STAFF
from igdectk.module.manager import module_manager
from igdectk.module.menu import MenuEntry, MenuSeparator
from igdectk.module.module import Module, ModuleMenu
from igdectk.bootstrap.customglyph import FaGlyph

from main.config import configuration


class CollGateAccession(ApplicationMain):
    name = '.'.join(__name__.split('.')[0:-1])

    def __init__(self, app_name, app_module):
        super(CollGateAccession, self).__init__(app_name, app_module)

        # different types of formats for type of descriptors for this module
        self.format_types = []

        # different types of formats for layout of descriptors for this module
        self.layout_types = []

        # different formats of action step
        self.action_step_formats = []

    def ready(self):
        super().ready()

        # register descriptor cache category
        from main.cache import cache_manager
        cache_manager.register('accession')

        from messenger.cache import client_cache_manager
        client_cache_manager.register('accession')

        from main.models import main_register_models
        main_register_models(CollGateAccession.name)

        from audit.models import audit_register_models
        audit_register_models(CollGateAccession.name)

        # create a module accession
        accession_module = Module('accession', base_url='coll-gate')
        accession_module.include_urls(
            (
                'base',
                'accessionsynonym',
                'actions.actiontype',
                'actions.action',
                'accession',
                'accessionbatch',
                'batch',
                'accessionpanel',
                'batchpanel',
                'accessionclassificationentry',
                'storagelocation'
            )
        )

        # add the describable entities models
        from .models import Accession, Batch, AccessionPanel, BatchPanel

        # descriptor_module
        from django.apps import apps
        descriptor_app = apps.get_app_config('descriptor')
        descriptor_app.describable_entities += [
            Accession,
            Batch,
            AccessionPanel,
            BatchPanel
        ]

        # add the classificationEntry entities models, classification_module
        classification_app = apps.get_app_config('classification')
        classification_app.children_entities += [
            Accession
        ]

        # registers standard format type of descriptors layouts
        from accession import layouttype

        for element in dir(layouttype):
            attr = getattr(layouttype, element)
            if type(attr) is type and layouttype.LayoutType in attr.__bases__:
                self.layout_types.append(attr())

        # and register them
        LayoutTypeManager.register(self.layout_types)

        # and the action type formats
        from accession.actions import actionstepformat

        for element in dir(actionstepformat):
            attr = getattr(actionstepformat, element)
            if type(attr) is type and attr is not actionstepformat.ActionStepFormat and issubclass(attr, actionstepformat.ActionStepFormat):
                self.action_step_formats.append(attr())

        from accession.actions.actionstepformat import ActionStepFormatManager
        ActionStepFormatManager.register(self.action_step_formats)

        # accession menu
        menu_accession = ModuleMenu('accession', _('Accession'), auth=AUTH_USER)

        menu_accession.add_entry(
            MenuEntry('create-accession', _('Create accession'), "~accession/accession/create",
                      icon=FaGlyph('plus'), order=1))

        menu_accession.add_entry(MenuSeparator(100))
        menu_accession.add_entry(
            MenuEntry('list-accession', _('List accessions'), "#accession/accession/", icon=FaGlyph('list'), order=101))
        menu_accession.add_entry(
            MenuEntry('panel-accession', _('Panel accessions'), "#accession/accessionpanel/",
                      icon=FaGlyph('list-alt'), order=102))

        menu_accession.add_entry(MenuSeparator(200))
        menu_accession.add_entry(
            MenuEntry('search-accession', _('Search accessions'), "~accession/accession/search",
                      icon=FaGlyph('search'), order=201))

        accession_module.add_menu(menu_accession)

        # batch menu
        menu_batch = ModuleMenu('batch', _('Batch'), auth=AUTH_USER)

        menu_batch.add_entry(
            MenuEntry('create-batch', _('Introduce a batch'), "~accession/batch/create",
                      icon=FaGlyph('plus'), order=1))

        menu_batch.add_entry(MenuSeparator(100))
        menu_batch.add_entry(
            MenuEntry('list-batches', _('List batches'), "#accession/batch/", icon=FaGlyph('list'), order=101))
        menu_batch.add_entry(
            MenuEntry('panel-batches', _('Panel batches'), "#accession/batchpanel/",
                      icon=FaGlyph('list-alt'), order=102))

        menu_batch.add_entry(MenuSeparator(200))
        menu_batch.add_entry(
            MenuEntry('search-batch', _('Search batches'), "~accession/batch/search",
                      icon=FaGlyph('search'), order=201))

        accession_module.add_menu(menu_batch)

        # action menu
        menu_action = ModuleMenu('action', _('Action'), auth=AUTH_USER)

        menu_action.add_entry(
            MenuEntry('create-action', _('Create action'), "~accession/action/create",
                      icon=FaGlyph('plus'), order=1))

        menu_action.add_entry(MenuSeparator(100))
        menu_action.add_entry(
            MenuEntry('list-actions', _('List actions'), "#accession/action/",
                      icon=FaGlyph('list-alt'), order=101))

        accession_module.add_menu(menu_action)

        # accession administration menu
        menu_administration = ModuleMenu('administration', _('Administration'), order=999, auth=AUTH_STAFF)

        # storage location menu
        menu_administration.add_entry(
            MenuEntry('list-location', _('Storage locations'), "#accession/storagelocation/",
                      icon=FaGlyph('archive'), order=-196, auth=AUTH_STAFF))

        # descriptor related menus
        menu_administration.add_entry(MenuSeparator(500))
        menu_administration.add_entry(
            MenuEntry('list-action-type', _('Action types'), "#accession/actiontype/",
                      icon=FaGlyph('cubes'), order=501, auth=AUTH_STAFF))
        accession_module.add_menu(menu_administration)

        module_manager.register_module(accession_module)

        if self.is_run_mode():
            self.post_ready()

    def post_ready(self):
        from accession import localsettings

        localsettings.max_file_size = self.get_setting('max_file_size')

        if not isinstance(localsettings.max_file_size, int):
            configuration.wrong("accession", "Accession action upload data max file size",
                                "Max file size must be an integer.")

        if localsettings.max_file_size <= 1024:
            configuration.wrong("accession",
                                "Accession action upload data max file size",
                                "Max file size must be greater than 1024 bytes.")
        else:
            configuration.validate("accession",
                                   "Accession action upload data max file size",
                                   "Max file size is %i bytes." % localsettings.max_file_size)

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

        # setup the name builders
        from accession.namebuilder import NameBuilder, NameBuilderManager
        NameBuilderManager.init()

        NameBuilderManager.register(NameBuilderManager.GLOBAL_ACCESSION,
                                    NameBuilder("accession_naming_seq", self.get_setting("accession_naming")))

        NameBuilderManager.register(NameBuilderManager.GLOBAL_BATCH,
                                    NameBuilder("batch_naming_seq", self.get_setting("batch_naming")))

        # print(NameBuilderManager.get(NameBuilderManager.GLOBAL_BATCH).pick({'ACCESSION_CODE': '032354'}, ['M']))
