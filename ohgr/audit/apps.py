# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
ohgr audit application main
"""
# from django.utils.translation import ugettext_noop as _
from django.utils.translation import ugettext_lazy as _

from igdectk.common.apphelpers import ApplicationMain
from igdectk.module import AUTH_USER, AUTH_STAFF
from igdectk.module.manager import module_manager
from igdectk.module.menu import MenuEntry, MenuSeparator
from igdectk.module.module import Module, ModuleMenu
from igdectk.bootstrap.glyphs import Glyph


class OhgrAudit(ApplicationMain):
    name = '.'.join(__name__.split('.')[0:-1])

    def ready(self):
        super().ready()

        audit_module = Module('audit', base_url='ohgr')
        audit_module.include_urls((
            'base')
        )

        # audit menu
        menu_audit = ModuleMenu('audit', _('Audit'), auth=AUTH_STAFF, order=1000)
        # menu_audit.add_entry(MenuEntry('edit', _('Edit information'), "#profile/edit/", icon=Glyph.USER, order=8))
        menu_audit.add_entry(MenuSeparator(9))
        audit_module.add_menu(menu_audit)

        module_manager.register_menu(audit_module)
