# -*- coding: utf-8; -*-
#
# @file init_fixtures.py
# @brief Install the initials asset of data for each application that needs it.
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

from main.models import main_unregister_models
from audit.models import audit_unregister_models


class Command(BaseCommand):
    help = "Install fixtures for each application."

    def add_arguments(self, parser):
        # Simulate (not transaction commit)
        parser.add_argument(
            '-s', '--simulate',
            action='store_true',
            dest='simulate',
            default=False,
            help='Simulate the fixtures initialisation. Does not proceed to a transaction commit.'
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
                colorama.Fore.CYAN + ("+ Process fixtures using audit username %s" % localsettings.migration_user.username) +
                colorama.Style.RESET_ALL + '\n')
        else:
            sys.stdout.write(colorama.Fore.CYAN + "+ Process fixtures without using audit" + colorama.Style.RESET_ALL + '\n')

        if options.get('simulate'):
            sys.stdout.write(colorama.Fore.RED + "+ Begin transaction in simulation mode (no commit)..." + colorama.Style.RESET_ALL + '\n')
        else:
            sys.stdout.write(colorama.Fore.RED + "+ Begin transaction..." + colorama.Style.RESET_ALL + '\n')

        connection = transaction.get_connection()

        connection.set_autocommit(False)

        error = False

        # disable audit if not asked
        from audit import localsettings
        if not localsettings.migration_audit:
            for module in module_manager.modules:
                # avoid main signal during fixture processing
                main_unregister_models(module.name)
                # and audit creation
                audit_unregister_models(module.name)

        from descriptor.fixtures import manager
        fixture_manager = manager.FixtureManager()

        for module in module_manager.modules:
            sys.stdout.write(colorama.Fore.RESET + " - Lookups for fixtures in module '%s'\n" % module.name)

            try:
                lib = importlib.import_module(module.name + ".fixtures", 'ORDER')

                if len(lib.ORDER) > 0:
                    sys.stdout.write(colorama.Fore.BLUE + " > Founds fixtures for the module '%s'\n" % module.name)

                for fixture in lib.ORDER:
                    try:
                        # try to found a fixture function
                        foo = importlib.import_module(module.name + ".fixtures." + fixture, 'fixture')

                        sys.stdout.write(colorama.Fore.GREEN + "  - Execute fixture '%s':" % fixture + colorama.Style.RESET_ALL + '\n')
                        # process the current fixture
                        foo.fixture(fixture_manager)

                        sys.stdout.write(colorama.Fore.GREEN + "  - Done fixture '%s':" % fixture + colorama.Style.RESET_ALL + '\n')
                    except BaseException as e:
                        sys.stderr.write(colorama.Fore.WHITE + colorama.Back.RED + "{0}".format(e) + colorama.Style.RESET_ALL + '\n')
                        error = True

            except BaseException:
                continue

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
