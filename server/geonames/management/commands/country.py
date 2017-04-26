# -*- coding: utf-8; -*-
#
# @file country.py
# @brief 
# @author Medhi BOULNEMOUR (INRA UMR1095)
# @date 2017-01-03
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

"""
Install Country
"""

from django.core.management import BaseCommand
from geonames.appsettings import COUNTRY_SOURCES, ICountry, DATA_DIR
from geonames.models import Country
from geonames.geonames import Geonames
from django.db import transaction

import progressbar
import resource
import sys
import os
from django.utils import timezone
from colorama import Fore, Style


class MemoryUsageWidget(progressbar.widgets.WidgetBase):
    def __call__(self, progress, data):
        if sys.platform != 'win32':
            return '%s kB' % resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
        return '?? kB'


class Command(BaseCommand):
    help = """Download all files in GEONAMES_COUNTRY_SOURCES if they were updated or if
    --force option was used.
    And Import country data if they were downloaded."""

    def __init__(self):
        super(Command, self).__init__()
        self.progress_enabled = False
        self.progress_widgets = None
        self.progress = 0
        self.force = False
        self.export = False
        self.delete = False

    def add_arguments(self, parser):
        # Named (optional) arguments
        parser.add_argument(
            '-f', '--force',
            action='store_true',
            dest='force',
            default=False,
            help='Download and import even if matching files are up-to-date',
        )
        parser.add_argument(
            '-np', '--no-progress',
            action='store_true',
            dest='no-progress',
            default=False,
            help='Hide progress bar'
        )
        parser.add_argument(
            '-e', '--export',
            dest='export',
            action='store',
            default=False,
            nargs='?',
            help='Export files with matching data only. Absolute path to export file'
        )
        parser.add_argument(
            '-d', '--delete',
            dest='delete',
            action='store_true',
            default=False,
            help='Delete local source files after importation'
        )

    def progress_init(self):
        """Initialize progress bar."""
        if self.progress_enabled:
            self.progress = 0
            self.progress_widgets = [
                Fore.LIGHTCYAN_EX,
                'RAM used: ',
                MemoryUsageWidget(),
                ' ',
                progressbar.ETA(),
                ' Done: ',
                progressbar.Percentage(),
                ' ',
                progressbar.Bar(
                    marker='▓',
                    fill='░'
                ),
                ' ',
                progressbar.AnimatedMarker(markers='⎺⎻⎼⎽⎼⎻'),
                ' ',
                Style.RESET_ALL,
            ]

    def progress_start(self, max_value):
        """Start progress bar."""
        if self.progress_enabled:
            self.progress = progressbar.ProgressBar(
                max_value=max_value,
                widgets=self.progress_widgets
            ).start()

    def progress_update(self, value):
        """Update progress bar."""
        if self.progress_enabled:
            self.progress.update(value)

    def progress_finish(self):
        """Finalize progress bar."""
        if self.progress_enabled:
            self.progress.finish()

    @transaction.atomic
    def handle(self, *args, **options):

        self.country_manager(args, options)

    def country_manager(self, args, options):

        self.progress_enabled = not options.get('no-progress')
        self.export = options.get('export')
        self.force = options.get('force')

        if self.export is None:
            self.export = '%s/country_light_%s.txt' % (DATA_DIR,
                                                       timezone.now().isoformat('_')
                                                       .replace(':', '-')
                                                       .replace('.', '-'))

        self.delete = options.get('delete')

        self.progress_init()

        if self.export:
            file_path = self.export

            if os.path.exists(file_path):
                os.remove(file_path)
            else:
                print('Creating %s' % file_path)

            export_file = open(file_path, 'a')

        for source in COUNTRY_SOURCES:

            geonames = Geonames(source, force=self.force)

            if not geonames.need_run:
                continue

            i = 0
            nb_lines = geonames.num_lines()
            refresh_tx = int(nb_lines / 100) if (nb_lines / 100) >= 1 else 1
            self.progress_start(nb_lines)

            if not self.progress_enabled:
                print('Importing...')

            for items in geonames.parse():
                imported = self.country_import(items)

                if self.export and imported:
                    export_file.write('\t'.join(items) + '\n')

                i += 1
                if i % refresh_tx == 0:
                    self.progress_update(i)

            self.progress_finish()

            if self.export:
                export_file.close()

            geonames.finish(delete=self.delete)

    def country_import(self, items):
        x, v = Country.objects.update_or_create(
            geoname_id=items[ICountry.geonameid],
            defaults={
                'code2': items[ICountry.code],
                'name': items[ICountry.name],
                'phone': items[ICountry.phone].replace('+', ''),
                'code3': items[ICountry.code3],
                'continent': items[ICountry.continent]
            }
        )

        if not self.progress_enabled:
            print(self.display_added_country(v, x))

        return True

    @staticmethod
    def display_added_country(added, country):

        if not added:
            display_status = Fore.RED
        else:
            display_status = Fore.GREEN

        display_status = display_status + str(added) + Style.RESET_ALL

        return "Added: %s | Country: %s" % (display_status, country)

