# -*- coding: utf-8; -*-
#
# @file apps.py
# @brief 
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2017-01-03
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

"""
coll-gate organisation module main
"""
import sys

from django.core.exceptions import ImproperlyConfigured
from django.utils.translation import ugettext_lazy as _

from igdectk.common.apphelpers import ApplicationMain
from igdectk.module import AUTH_STAFF
from igdectk.module.manager import module_manager
from igdectk.module.menu import MenuEntry, MenuSeparator
from igdectk.module.module import Module, ModuleMenu
from igdectk.bootstrap.glyphs import Glyph
from main.config import Configuration, configuration


class CollGateOrganisation(ApplicationMain):
    name = '.'.join(__name__.split('.')[0:-1])

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
            MenuEntry('grc-details', _('Manage GRC'), "#organisation/grc/", icon=Glyph.CLOUD, order=1))
        menu_organisation.add_entry(
            MenuEntry('grc-organisation',
                      _('Manage GRC partners'),
                      "#organisation/grc/organisation/",
                      icon=Glyph.BOOKMARK,
                      order=2))
        menu_organisation.add_entry(
            MenuEntry('organisation',
                      _('Manage organisations'),
                      "#organisation/organisation/",
                      icon=Glyph.MAP_MARKER,
                      order=3))
        menu_organisation.add_entry(
            MenuEntry('create-organisation',
                      _('Create an organisation or a partner'),
                      "~organisation/organisation/create/",
                      icon=Glyph.PLUS_SIGN,
                      order=4))

        organisation_module.add_menu(menu_organisation)

        module_manager.register_module(organisation_module)

        command_list = ("init_fixtures", "migrate", "makemigrations", "help", "")
        post_ready = True

        for command in command_list:
            if command in sys.argv:
                post_ready = False
                break

        if post_ready:
            self.post_ready()

    def post_ready(self):
        # check if there is a unique GRC model instance
        from organisation.models import GRC
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

        # keep descriptor meta-model for organisation and establishment.
        from descriptor.models import DescriptorMetaModel

        if not DescriptorMetaModel.objects.filter(name="organisation").exists():
            configuration.wrong(
                "organisation",
                "Organisation descriptor meta-model",
                "Missing organisation descriptor meta-model. Be sure to have installed fixtures.")
        else:
            configuration.validate(
                "organisation",
                "Organisation descriptor meta-model",
                "Organisation descriptor meta-model detected.")

        if not DescriptorMetaModel.objects.filter(name="establishment").exists():
            configuration.wrong(
                "organisation",
                "Establishment descriptor meta-model",
                "Missing establishment descriptor meta-model. Be sure to have installed fixtures.")
        else:
            configuration.validate(
                "organisation",
                "Establishment descriptor meta-model",
                "Establishment descriptor meta-model detected.")

