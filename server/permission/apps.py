# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
coll-gate taxonomy module main
"""

from django.utils.translation import ugettext_lazy as _

from igdectk.common.apphelpers import ApplicationMain
from igdectk.module import AUTH_STAFF
from igdectk.module.manager import module_manager
from igdectk.module.menu import MenuEntry, MenuSeparator
from igdectk.module.module import Module, ModuleMenu
from igdectk.bootstrap.glyphs import Glyph


class CollGatePermission(ApplicationMain):
    name = '.'.join(__name__.split('.')[0:-1])

    def ready(self):
        super().ready()

        # create a module permission
        permission_module = Module('permission', base_url='coll-gate')
        permission_module.include_urls((
            'base',
            )
        )

        # permission menu
        menu_permission = ModuleMenu('administration', _('Administration'), order=999, auth=AUTH_STAFF)

        menu_permission.add_entry(MenuSeparator(100))
        menu_permission.add_entry(
            MenuEntry('user-permission', _('Manage users'), "#permission/user/", icon=Glyph.CONSOLE, order=101))
        menu_permission.add_entry(
            MenuEntry('group-permission', _('Manage groups'), "#permission/group/", icon=Glyph.FOLDER_CLOSE, order=102))
        permission_module.add_menu(menu_permission)

        module_manager.register_module(permission_module)
