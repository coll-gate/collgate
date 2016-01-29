# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
ohgr application main
"""

from igdectk.module import AUTH_USER
from igdectk.module.module import Module, ModuleMenu
from igdectk.module.menu import MenuEntry, MenuSeparator
from igdectk.module.manager import module_manager
from igdectk.common.apphelpers import ApplicationMain
from igdectk.module.menu import MenuEntry


class OhgrMain(ApplicationMain):
    name = '.'.join(__name__.split('.')[0:-1])

    def ready(self):
        super().ready()

        # import module containing REST handlers
        from . import profile
        from . import home

        # create defaults menus
        main_module = Module('main')

        # simple test menu
        menu_test = ModuleMenu('test', 'Test')
        menu_test.add_entry(MenuEntry('test1', 'Test without icon', "main:home", order=5))
        menu_test.add_entry(MenuEntry('test2', 'Test with icon', "main:home", "user", 2))
        menu_test.add_entry(MenuSeparator(3))
        menu_test.add_entry(MenuEntry('test3', 'Test for auth user', "main:home", "user", auth=AUTH_USER))
        main_module.add_menu(menu_test)

        # profile menu
        menu_profile = ModuleMenu('profile', 'Profile', auth=AUTH_USER)
        menu_profile.add_entry(MenuEntry('edit', 'Edit information', "main:profile-edit", icon="user", order=8))
        menu_profile.add_entry(MenuSeparator(9))
        menu_profile.add_entry(MenuEntry('logout', 'Logout', "main:profile-logout", icon="off", order=10))
        main_module.add_menu(menu_profile)

        module_manager.register_module(main_module)
