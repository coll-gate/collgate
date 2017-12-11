# -*- coding: utf-8; -*-
#
# @file apps.py
# @brief coll-gate audit application main
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2016-09-01
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

import os
import sys

from django.utils.translation import ugettext_lazy as _

from igdectk.common.apphelpers import ApplicationMain
from igdectk.module import AUTH_STAFF
from igdectk.module.manager import module_manager
from igdectk.module.menu import MenuEntry
from igdectk.module.module import Module, ModuleMenu
from igdectk.bootstrap.customglyph import FaGlyph


class CollGateAudit(ApplicationMain):
    name = '.'.join(__name__.split('.')[0:-1])

    def get_global_settings(self):
        from django.conf import settings
        from django.contrib.auth import get_user_model

        from . import localsettings
        from . import appsettings

        # default comes from appsettings
        localsettings.migration_audit = appsettings.AUDIT_MIGRATION['AUDIT']
        localsettings.migration_username = appsettings.AUDIT_MIGRATION['USERNAME']

        # project setting can overrides
        if hasattr(settings, 'AUDIT_MIGRATION'):
            localsettings.migration_audit = settings.AUDIT_MIGRATION.get('AUDIT', True)
            localsettings.migration_username = settings.AUDIT_MIGRATION.get('USERNAME', 'root')

        # if environment variable is defined, override previous settings
        var = os.environ.get('COLLGATE_MIGRATION_AUDIT')
        if var and var == '1':
            localsettings.migration_audit = True

        var = os.environ.get('COLLGATE_MIGRATION_AUDIT_USERNAME')
        if var and var != '':
            localsettings.migration_username = var

        if localsettings.migration_audit:
            UserModel = get_user_model()
            try:
                localsettings.migration_user = UserModel.objects.get(username=localsettings.migration_username)
            except UserModel.DoesNotExist:
                # user not found, disable user for audit
                localsettings.migration_user = None
                localsettings.migration_audit = False

    def ready(self):
        super().ready()

        from . import localsettings

        if "init_fixtures" in sys.argv or "data_migrate" in sys.argv or "migrate" in sys.argv:
            # migration mode is defined for init_fixture or data_migrate commands
            localsettings.migration_mode = True

            # checkout global settings
            self.get_global_settings()

        audit_module = Module('audit', base_url='coll-gate')
        audit_module.include_urls((
            'base',
            'history'
        ))

        # ignore audit from content types
        audit_module.ignored_content_types = [
            'audit.'
        ]

        # ignore audit from permission types
        audit_module.ignored_permission_types = [
            'audit.'
        ]

        # audit menu
        menu_audit = ModuleMenu('audit', _('Tracability'), auth=AUTH_STAFF, order=900)
        menu_audit.add_entry(MenuEntry('audit-user', _('Tracability for a user'), "~audit/audit/searchByUserName", icon=FaGlyph('user'), order=1))
        menu_audit.add_entry(MenuEntry('audit-entity', _('Tracability for an entity'), "~audit/audit/searchByEntity", icon=FaGlyph('book'), order=2))
        audit_module.add_menu(menu_audit)

        module_manager.register_module(audit_module)
