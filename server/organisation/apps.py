# -*- coding: utf-8; -*-
#
# Copyright (c) 2017 INRA UMR1095 GDEC

"""
coll-gate organisation module main
"""

from django.utils.translation import ugettext_lazy as _

from igdectk.common.apphelpers import ApplicationMain
from igdectk.module import AUTH_STAFF
from igdectk.module.manager import module_manager
from igdectk.module.menu import MenuEntry, MenuSeparator
from igdectk.module.module import Module, ModuleMenu
from igdectk.bootstrap.glyphs import Glyph


class CollGateOrganisation(ApplicationMain):
    name = '.'.join(__name__.split('.')[0:-1])

    def ready(self):
        super().ready()

        # create a module organisation
        organisation_module = Module('organisation', base_url='coll-gate')
        organisation_module.include_urls((
            'base',
            )
        )

        # keep descriptor meta-model for organisation and establishment.
        # @todo

        # organisation menu
        menu_organisation = ModuleMenu('administration', _('Administration'), order=999, auth=AUTH_STAFF)
        menu_organisation.add_entry(
            MenuEntry('grc-details', _('Manage GRC'), "#organisation/grc/", icon=Glyph.CLOUD, order=1))
        menu_organisation.add_entry(
            MenuEntry('grc-organisation',
                      _('Manage GRC organisations'),
                      "#organisation/grc/organisation/",
                      icon=Glyph.BOOKMARK,
                      order=2))
        organisation_module.add_menu(menu_organisation)

        module_manager.register_menu(organisation_module)
