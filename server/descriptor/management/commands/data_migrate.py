# -*- coding: utf-8; -*-
#
# @file data_migrate.py
# @brief Process to a migration of GRC content partial or complete, initial or punctual.
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2017-01-03
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

from __future__ import unicode_literals, absolute_import, division

import sys
import importlib
import colorama

from django.core.management.base import BaseCommand
from django.db import transaction

from igdectk.module.manager import module_manager

from audit.models import unregister_models


class Command(BaseCommand):
    help = "Process to a migration of GRC content partial or complete, initial or punctual."

    def add_arguments(self, parser):
        # Simulate (not transaction commit)
        parser.add_argument(
            '-s', '--simulate',
            action='store_true',
            dest='simulate',
            default=False,
            help='Simulate the data migration. Does not proceed to a transaction commit.'
        )
        # Migration module
        parser.add_argument(
            '-m', '--migration',
            dest='migration',
            default=None,
            help='Defines the starting module of the migration.'
        )
        # Audit
        parser.add_argument(
            '-a', '--audit',
            action='store_true',
            dest='audit',
            default=False,
            help='Perform audit operations.',
        )
        # Audit username
        parser.add_argument(
            '-u', '--user',
            dest='username',
            default='root',
            help='Defines the username used for audit operations.'
        )

    def handle(self, *args, **options):

        from audit import localsettings

        if options.get('audit'):
            localsettings.override_settings(True, options.get('username'))
        else:
            localsettings.override_settings(False, None)

        colorama.init()

        if localsettings.migration_audit:
            sys.stdout.write(
                colorama.Fore.CYAN + ("+ Process data migration using audit username %s" % localsettings.migration_user.username) +
                colorama.Style.RESET_ALL + '\n')
        else:
            sys.stdout.write(colorama.Fore.CYAN + "+ Process data migration without using audit" + colorama.Style.RESET_ALL + '\n')

        if options.get('simulate'):
            sys.stdout.write(colorama.Fore.RED + "+ Begin transaction in simulation mode (no commit)..." + colorama.Style.RESET_ALL + '\n')
        else:
            sys.stdout.write(colorama.Fore.RED + "+ Begin transaction..." + colorama.Style.RESET_ALL + '\n')

        connection = transaction.get_connection()
        connection.set_autocommit(False)

        error = False

        # disable audit if not asked, by removing any models signals
        from audit import localsettings
        if not localsettings.migration_audit:
            for module in module_manager.modules:
                # avoid audit during fixture processing
                unregister_models(module.name)

        from descriptor.fixtures import manager
        fixture_manager = manager.FixtureManager()

        try:
            lib = importlib.import_module(options.get('migration'), 'DataMigration')
        except TypeError or ImportError:
            sys.stdout.write(colorama.Fore.RED + "+ Error during importation of data migration script..." + colorama.Style.RESET_ALL + '\n')
            error = True

        dataMigration = lib.DataMigration(fixture_manager)

        try:
            dataMigration.migrate()
        except Exception as e:
            import traceback
            trace = traceback.print_exc()
            if trace:
                sys.stdout.write(trace + '\n')

            error = True

        if error:
            sys.stdout.write(colorama.Back.RED + "! Rollback transaction..." + colorama.Style.RESET_ALL + '\n')
            connection.rollback()
        elif options.get('simulate'):
            sys.stdout.write(colorama.Fore.RED + "+ Simulation success. Rollback transaction..." + colorama.Style.RESET_ALL + '\n')
            connection.rollback()
        else:
            sys.stdout.write(colorama.Fore.RED + "+ Commit transaction..." + colorama.Style.RESET_ALL + '\n')
            connection.commit()

        connection.close()
