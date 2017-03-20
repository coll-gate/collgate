# -*- coding: utf-8 -*-
#
# Copyright (c) 2017 INRA UMR1095 GDEC

"""
Install the initials asset of data for each application that needs it.
"""

from __future__ import unicode_literals, absolute_import, division

import sys
import importlib
import colorama

from django.core.management.base import BaseCommand
from django.db import transaction

from igdectk.module.manager import module_manager

from audit.models import unregister_models


class Command(BaseCommand):
    help = "Install fixtures for each application."

    def handle(self, *args, **options):

        colorama.init()

        sys.stdout.write(colorama.Fore.RED + "+ Begin transaction...\n" + colorama.Style.RESET_ALL)
        connection = transaction.get_connection()

        connection.set_autocommit(False)

        error = False

        for module in module_manager.modules:
            # avoid audit during fixture processing
            unregister_models(module.name)

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

        if not error:
            sys.stdout.write(colorama.Fore.RED + "+ Commit transaction..." + colorama.Style.RESET_ALL + '\n')
            connection.commit()
        else:
            sys.stdout.write(colorama.Back.RED + "! Rollback transaction..." + colorama.Style.RESET_ALL + '\n')
            connection.rollback()

        connection.close()
