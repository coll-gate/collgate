# -*- coding: utf-8; -*-
#
# @file apps.py
# @brief coll-gate application main
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2016-09-01
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

import json
import sys

from django.utils.translation import ugettext_lazy as _

from igdectk.common.apphelpers import ApplicationMain
from igdectk.module import AUTH_USER, AUTH_STAFF, AUTH_SUPER_USER
from igdectk.module.manager import module_manager
from igdectk.module.menu import MenuEntry, MenuSeparator
from igdectk.module.module import Module, ModuleMenu
from igdectk.bootstrap.glyphs import Glyph


class CollGateMain(ApplicationMain):
    name = '.'.join(__name__.split('.')[0:-1])

    def ready(self):
        super().ready()

        main_module = Module('main', base_url='coll-gate')
        main_module.include_urls((
            'base',
            'home',
            'contenttype',
            'entity',
            'profile',
            'language',
            'help',
            'eventmessage'
            )
        )

        # profile menu (merged directly into main/index.html
        # menu_profile = ModuleMenu('profile', _('Profile'), auth=AUTH_USER, order=1000)
        # menu_profile.add_entry(MenuEntry('edit', _('Edit information'), "#main/profile/edit/", icon=Glyph.USER, order=8))
        # menu_profile.add_entry(MenuSeparator(9))
        # menu_profile.add_entry(MenuEntry('logout', _('Logout'), "#main/profile/logout/", icon=Glyph.OFF, order=10))
        # main_module.add_menu(menu_profile)

        # administration menu
        menu_administration = ModuleMenu('administration', _('Administration'), order=999, auth=AUTH_STAFF)

        # administration related menus
        menu_administration.add_entry(
            MenuEntry('server-config', _('Server configuration'), "#main/config/",
                      icon=Glyph.COG, order=-199, auth=AUTH_SUPER_USER))

        menu_administration.add_entry(
            MenuEntry('language-list', _('Configured languages'), "#main/language/",
                      icon=Glyph.LIST, order=-198, auth=AUTH_SUPER_USER))

        menu_administration.add_entry(
            MenuEntry('entity-synonym-type-list', _('Configured types of synonyms'), "#main/entity-synonym-type/",
                      icon=Glyph.TH_LIST, order=-197, auth=AUTH_SUPER_USER))
        menu_administration.add_entry(MenuSeparator(-100, auth=AUTH_SUPER_USER))
        main_module.add_menu(menu_administration)

        # help menu
        menu_help = ModuleMenu('help', _('Help'), order=1001)
        menu_help.add_entry(
            MenuEntry('manual', _('Manual index'), "#main/help/", Glyph.BOOK, 50))
        menu_help.add_entry(MenuSeparator(100))
        menu_help.add_entry(
            MenuEntry('about', _('About Coll-Gate IS...'), "#main/about/", Glyph.INFO_SIGN, 101))
        main_module.add_menu(menu_help)

        module_manager.register_module(main_module)

        if self.is_run_mode():
            self.post_ready()

    def post_ready(self):
        if self.is_table_exists('main_language'):
            # add defaults languages if they doesn't exists
            from main.models import Language
            if not Language.objects.filter(code='en').exists():
                language = Language(code='en', label={'en': 'English', 'fr': 'Anglais'})
                language.save()

            if not Language.objects.filter(code='fr').exists():
                language = Language(code='fr', label={'en': 'French', 'fr': 'Français'})
                language.save()

            if not Language.objects.filter(code='la').exists():
                language = Language(code='la', label={'en': 'Latin', 'fr': 'Latin'})
                language.save()
