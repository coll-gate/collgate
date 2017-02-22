# -*- coding: utf-8 -*-

"""
Install Country
"""

from django.core.management import BaseCommand
from geonames.appsettings import TRANSLATION_SOURCES, TRANSLATION_LANGUAGES, IAlternate, DATA_DIR
from geonames.models import AlternateName, Country, City
from geonames.geonames import Geonames
from django.db import transaction

import progressbar
import resource, sys, os
from django.utils import timezone
from colorama import Fore, Style


class MemoryUsageWidget(progressbar.widgets.WidgetBase):
    def __call__(self, progress, data):
        if sys.platform != 'win32':
            return '%s kB' % resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
        return '?? kB'


class Command(BaseCommand):
    help = """Download all files in GEONAMES_TRANSLATION_SOURCES if they were updated or if
    --force option was used.
    And Import translation data if they were downloaded."""

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
            dest = 'export',
            action='store',
            default=False,
            nargs='?',
            help = 'Export files with matching data only. Absolute path to export file'
        )
        parser.add_argument(
            '-d', '--delete',
            dest = 'delete',
            action='store_true',
            default=False,
            help = 'Delete local source files after importation'
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

        self.translation_manager(args, options)

    def translation_manager(self, args, options):

        self.progress_enabled = not options.get('no-progress')
        self.export = options.get('export')
        self.force = options.get('force')

        if self.export == None:
            self.export = '%s/alt_name_light_%s.txt' % (DATA_DIR,
                                                        timezone.now().isoformat('_')
                                                        .replace(':','-')
                                                        .replace('.','-'))

        self.delete = options.get('delete')

        self.progress_init()


        if self.export:
            file_path = self.export

            if os.path.exists(file_path):
                os.remove(file_path)
            else:
                print('Creating %s' % file_path)

            export_file =  open(file_path, 'a')


        for source in TRANSLATION_SOURCES:

            geonames = Geonames(source, force=self.force)

            if not geonames.need_run:
                continue

            i = 0
            self.progress_start(geonames.num_lines())

            if not self.progress_enabled:
                print('Importing...')

            for items in geonames.parse():
                imported = self.translation_import(items)

                if self.export and imported:
                    export_file.write('\t'.join(items) + '\n')

                i += 1
                self.progress_update(i)

            self.progress_finish()

            if self.export:
                export_file.close()

            geonames.finish(delete=self.delete)


    def translation_import(self, items):

        if items[IAlternate.language] not in TRANSLATION_LANGUAGES:
            return False

        try:
            city = City.objects.get(geoname_id=items[IAlternate.geonameid])
            alt_name, value = AlternateName.objects.get_or_create(
                language=items[IAlternate.language],
                alternate_name=items[IAlternate.name]
            )
            if not value:
                city.alt_names.add(alt_name)
                if not self.progress_enabled:
                    print('Translation found! : CITY %s - %s' % (city, alt_name))

            return True

        except:
            pass

        try:
            country = Country.objects.get(geoname_id=items[IAlternate.geonameid])
            alt_name, value = AlternateName.objects.get_or_create(
                language=items[IAlternate.language],
                alternate_name=items[IAlternate.name]
            )
            if not value:
                country.alt_names.add(alt_name)
                if not self.progress_enabled:
                    print('Translation found! : COUNTRY %s - %s' % (country, alt_name))

            return True

        except:
            pass

        return False