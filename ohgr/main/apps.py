# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
ohgr application main
"""
from django.utils.translation import ugettext_noop

from igdectk.common.apphelpers import ApplicationMain
from igdectk.module import AUTH_USER
from igdectk.module.manager import module_manager
from igdectk.module.menu import MenuEntry, MenuSeparator
from igdectk.module.module import Module, ModuleMenu
from igdectk.bootstrap.glyphs import Glyph


# ugettext = lambda s: s
_ = ugettext_noop  # ugettext


class OhgrMain(ApplicationMain):
    name = '.'.join(__name__.split('.')[0:-1])

    def __init__(self, app_name, app_module):
        super(OhgrMain, self).__init__(app_name, app_module)

    def ready(self):
        super().ready()

        # import module containing REST handlers
        from . import help
        from . import home
        from . import profile

        main_module = Module('main')

        # profile menu
        menu_profile = ModuleMenu('profile', _('Profile'), auth=AUTH_USER, order=1000)
        menu_profile.add_entry(MenuEntry('edit', _('Edit information'), "main:profile-edit", icon=Glyph.USER, order=8))
        menu_profile.add_entry(MenuSeparator(9))
        menu_profile.add_entry(MenuEntry('logout', _('Logout'), "main:profile-logout", icon=Glyph.OFF, order=10))
        main_module.add_menu(menu_profile)

        # help menu
        menu_help = ModuleMenu('help', _('Help'), order=1001)
        menu_help.add_entry(
            MenuEntry('manual', _('Manual index'), "main:help-manual", Glyph.BOOK, 50))
        menu_help.add_entry(MenuSeparator(100))
        menu_help.add_entry(
            MenuEntry('about', _('About HOGR...'), "main:help-about", Glyph.INFO_SIGN, 101))
        main_module.add_menu(menu_help)

        module_manager.register_module(main_module)

        from igdectk.rest.handler import RestHandler
        RestHandler.register_urls()
