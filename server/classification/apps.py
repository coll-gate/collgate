# -*- coding: utf-8; -*-
#
# @file apps.py
# @brief coll-gate classification module main
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2016-09-01
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

from django.utils.translation import ugettext_lazy as _

from descriptor.layouttype import LayoutTypeManager
from igdectk.common.apphelpers import ApplicationMain
from igdectk.module import AUTH_USER, AUTH_STAFF, AUTH_SUPER_USER
from igdectk.module.manager import module_manager
from igdectk.module.menu import MenuEntry, MenuSeparator
from igdectk.module.module import Module, ModuleMenu
from igdectk.bootstrap.customglyph import FaGlyph
from main.config import configuration


class CollGateClassification(ApplicationMain):
    name = '.'.join(__name__.split('.')[0:-1])

    def __init__(self, app_name, app_module):
        super(CollGateClassification, self).__init__(app_name, app_module)

        # different types of format for type of descriptors for this module
        self.format_types = []

        # defines the list of entities models that uses of a classification entry as parent
        self.children_entities = []

        # different types of layout of descriptors for this module
        self.layout_types = []

    def ready(self):
        super().ready()

        from main.models import main_register_models
        main_register_models(CollGateClassification.name)

        from audit.models import audit_register_models
        audit_register_models(CollGateClassification.name)

        # create a module classification
        classification_module = Module('classification', base_url='coll-gate')
        classification_module.include_urls((
            'base',
            'classification',
            'classificationentry',
            'classificationentrysynonym',
            'classificationentryrelated'
            )
        )

        # add the describable entities models
        from .models import ClassificationEntry

        # descriptor_module
        from django.apps import apps
        descriptor_app = apps.get_app_config('descriptor')
        descriptor_app.describable_entities += [
            ClassificationEntry
        ]

        # registers standard format type of layouts
        from classification import layouttype

        for element in dir(layouttype):
            attr = getattr(layouttype, element)
            if type(attr) is type and layouttype.LayoutType in attr.__bases__:
                self.layout_types.append(attr())

        # and register them
        LayoutTypeManager.register(self.layout_types)

        # administration menu
        menu_administration = ModuleMenu('administration', _('Administration'), order=999, auth=AUTH_STAFF)

        menu_administration.add_entry(MenuSeparator(400))

        # administration related menus
        menu_administration.add_entry(
            MenuEntry('classification-list', _('List of classifications'), "#classification/classification/",
                      icon=FaGlyph('sitemap'), order=401, auth=AUTH_SUPER_USER))

        classification_module.add_menu(menu_administration)

        # classification menu
        menu_classification = ModuleMenu('classification', _('Classification'), auth=AUTH_USER)
        menu_classification.add_entry(
            MenuEntry(
                'create-classification-entry',
                _('Create classification entry'),
                "~classification/classificationEntry/create",
                icon=FaGlyph('plus'),
                order=1))

        classification_module.add_menu(menu_classification)

        module_manager.register_module(classification_module)

        if self.is_run_mode():
            self.post_ready()

    def post_ready(self):
        from classification import localsettings
        from main.models import EntitySynonymType
        if self.is_table_exists(EntitySynonymType):
            builtins_types = ["classification_entry_name",
                              "classification_entry_code",
                              "classification_entry_alternate_name"]

            if EntitySynonymType.objects.filter(name__in=builtins_types).count() != len(builtins_types):
                configuration.wrong(
                    "classification",
                    "classification_entry_synonym_types",
                    "Missing builtins classification entry synonym types. Be sure to have installed fixtures.")
            else:
                configuration.validate("classification",
                                       "classification_entry_synonym_types",
                                       "classification entry synonym types detected.")

                # keep models id in cache
                localsettings.synonym_type_classification_entry_name = EntitySynonymType.objects.get(
                    name="classification_entry_name").pk
                localsettings.synonym_type_classification_entry_code = EntitySynonymType.objects.get(
                    name="classification_entry_code").pk
                localsettings.synonym_type_classification_entry_alternate_name = EntitySynonymType.objects.get(
                    name="classification_entry_alternate_name").pk
