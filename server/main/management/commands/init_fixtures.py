# -*- coding: utf-8 -*-

"""
Install the initials asset of data for each application that needs it.
"""

from __future__ import unicode_literals, absolute_import, division

import sys
import importlib

from django.core.management.base import BaseCommand
from django.db import transaction

from igdectk.module.manager import module_manager


class Command(BaseCommand):
    help = "Install fixtures for each application."

    def handle(self, *args, **options):
        connection = None
        error = False

        sys.stdout.write(" + Begin transaction...\n")
        connection = transaction.get_connection()

        connection.set_autocommit(False)

        error = False

        for module in module_manager.modules:
            sys.stdout.write("Lookups for fixtures in module '%s'\n" % module.name)

            try:
                lib = importlib.import_module(module.name + ".fixtures", 'ORDER')

                if len(lib.ORDER) > 0:
                    sys.stdout.write("> Founds fixtures for the module '%s'\n" % module.name)

                for fixture in lib.ORDER:
                    try:
                        # try to found a fixture function
                        foo = importlib.import_module(module.name + ".fixtures." + fixture, 'fixture')
                        # and call it
                        sys.stdout.write("  - Execute fixture '%s':\n" % fixture)
                        foo.fixture()
                        sys.stdout.write("  - Done fixture '%s':\n" % fixture)
                    except BaseException as e:
                        sys.stderr.write(e + "\n")
                        error = True

            except BaseException:
                continue

        if not error:
            sys.stdout.write(" + Commit transaction...\n")
            connection.commit()
        else:
            sys.stdout.write(" ! Rollback transaction...\n")
            connection.rollback()

        connection.close()
