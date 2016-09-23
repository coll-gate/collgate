# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
coll-gate audit application main
"""

from django.utils.translation import ugettext_lazy as _

from igdectk.common.apphelpers import ApplicationMain
from igdectk.module import AUTH_USER, AUTH_STAFF
from igdectk.module.manager import module_manager
from igdectk.module.menu import MenuEntry, MenuSeparator
from igdectk.module.module import Module, ModuleMenu
from igdectk.bootstrap.glyphs import Glyph


class CollGateAudit(ApplicationMain):
    name = '.'.join(__name__.split('.')[0:-1])

    def ready(self):
        super().ready()

        audit_module = Module('audit', base_url='coll-gate')
        audit_module.include_urls((
            'base',)
        )

        # ignore audit from content types
        audit_module.ignored_content_types = [
            'audit.'
        ]

        # ignore audit from permission types
        audit_module.ignored_permission_types = [
            'audit.'
        ]

        # audit menu
        menu_audit = ModuleMenu('audit', _('Audit'), auth=AUTH_STAFF, order=1000)
        menu_audit.add_entry(MenuEntry('audit-user', _('Audit for a user'), "~audit/audit/searchByUserName", icon=Glyph.USER, order=1))
        menu_audit.add_entry(MenuEntry('audit-entity', _('Audit for an entity'), "~audit/audit/searchByEntity", icon=Glyph.BOOK, order=2))
        audit_module.add_menu(menu_audit)

        module_manager.register_menu(audit_module)
