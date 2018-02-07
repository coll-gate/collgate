# -*- coding: utf-8; -*-
#
# @file apps.py
# @brief coll-gate organisation module main
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2017-01-03
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

from django.utils.translation import ugettext_lazy as _

from igdectk.common.apphelpers import ApplicationMain
from igdectk.module import AUTH_STAFF
from igdectk.module.manager import module_manager
from igdectk.module.menu import MenuEntry
from igdectk.module.module import Module, ModuleMenu
from igdectk.bootstrap.customglyph import FaGlyph
from main.config import configuration


class CollGateOrganisation(ApplicationMain):
    name = '.'.join(__name__.split('.')[0:-1])

    def __init__(self, app_name, app_module):
        super(CollGateOrganisation, self).__init__(app_name, app_module)

        # different types of format for type of descriptors for this module
        self.format_types = []

    def ready(self):
        super().ready()

        # create a module organisation
        organisation_module = Module('organisation', base_url='coll-gate')
        organisation_module.include_urls((
            'base',
            'organisationtype',
            'grc',
            'organisation',
            'establishment'
            )
        )

        # add the describable entities models
        from .models import Organisation, Establishment

        # descriptor_module
        from django.apps import apps
        descriptor_app = apps.get_app_config('descriptor')
        descriptor_app.describable_entities += [
            Organisation,
            Establishment
        ]

        # organisation menu
        menu_organisation = ModuleMenu('administration', _('Administration'), order=999, auth=AUTH_STAFF)
        menu_organisation.add_entry(
            MenuEntry('grc-details', _('Manage GRC'), "#organisation/grc/", icon=FaGlyph('cloud'), order=1))
        menu_organisation.add_entry(
            MenuEntry('organisation',
                      _('Manage organisations'),
                      "#organisation/organisation/",
                      icon=FaGlyph('map-marker'),
                      order=2))
        menu_organisation.add_entry(
            MenuEntry('create-organisation',
                      _('Create an organisation or a partner'),
                      "~organisation/organisation/create/",
                      icon=FaGlyph('plus'),
                      order=34))

        organisation_module.add_menu(menu_organisation)

        module_manager.register_module(organisation_module)

        if self.is_run_mode():
            self.post_ready()

    def post_ready(self):
        from organisation.models import GRC
        if self.is_table_exists(GRC):
            # check if there is a unique GRC model instance
            num_grcs = len(GRC.objects.all())

            if num_grcs == 0:
                self.logger.info("Missing GRC configuration. Create a unique GRC model instance. Need configuration.")
                grc = GRC()
                grc.save()

                configuration.partial("organisation", "GRC instance", "GRC instance created. Need configuration.")
            elif num_grcs > 1:
                configuration.wrong(
                    "organisation",
                    "GRC instance",
                    "Invalid GRC configuration. Only a unique GRC could be configured.")
            else:
                configuration.validate("organisation", "GRC instance", "GRC instance detected.")

        from descriptor.models import Layout
        if self.is_table_exists(Layout):
            # keep descriptor layout for organisation and establishment.
            if not Layout.objects.filter(name="organisation").exists():
                configuration.wrong(
                    "organisation",
                    "Organisation descriptor layout",
                    "Missing organisation descriptor layout. Be sure to have installed fixtures.")
            else:
                configuration.validate(
                    "organisation",
                    "Organisation descriptor layout",
                    "Organisation descriptor layout detected.")

            if not Layout.objects.filter(name="establishment").exists():
                configuration.wrong(
                    "organisation",
                    "Establishment descriptor layout",
                    "Missing establishment descriptor layout. Be sure to have installed fixtures.")
            else:
                configuration.validate(
                    "organisation",
                    "Establishment descriptor layout",
                    "Establishment descriptor layout detected.")
