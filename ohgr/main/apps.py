# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
ohgr application main
"""
# from django.utils.translation import ugettext_noop as _
from django.utils.translation import ugettext_lazy as _

from igdectk.common.apphelpers import ApplicationMain
from igdectk.module import AUTH_USER
from igdectk.module.manager import module_manager
from igdectk.module.menu import MenuEntry, MenuSeparator
from igdectk.module.module import Module, ModuleMenu
from igdectk.bootstrap.glyphs import Glyph


class OhgrMain(ApplicationMain):
    name = '.'.join(__name__.split('.')[0:-1])

    def ready(self):
        super().ready()

        main_module = Module('main', base_url='ohgr')
        main_module.include_urls((
            'help',
            'home',
            'profile')
        )

        # profile menu
        menu_profile = ModuleMenu('profile', _('Profile'), auth=AUTH_USER, order=1000)
        menu_profile.add_entry(MenuEntry('edit', _('Edit information'), "#profile/edit/", icon=Glyph.USER, order=8))
        menu_profile.add_entry(MenuSeparator(9))
        menu_profile.add_entry(MenuEntry('logout', _('Logout'), "#profile/logout/", icon=Glyph.OFF, order=10))
        main_module.add_menu(menu_profile)

        # help menu
        menu_help = ModuleMenu('help', _('Help'), order=1001)
        menu_help.add_entry(
            MenuEntry('manual', _('Manual index'), "#help/manual/", Glyph.BOOK, 50))
        menu_help.add_entry(MenuSeparator(100))
        menu_help.add_entry(
            MenuEntry('about', _('About HOGR...'), "#help/about/", Glyph.INFO_SIGN, 101))
        main_module.add_menu(menu_help)

        module_manager.register_menu(main_module)
