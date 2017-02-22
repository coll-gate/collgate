# -*- coding: utf-8 -*-

"""
Install City
"""

from django.db import transaction
from django.core.management import BaseCommand
from geonames.appsettings import CITY_SOURCES, IGeoname, DATA_DIR, INCLUDE_CITY_TYPES
from geonames.models import City, Country
from geonames.geonames import Geonames

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
    help = """Download all files in GEONAMES_CITY_SOURCES if they were updated or if
    --force option was used.
    And Import city data if they were downloaded."""

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

        self.city_manager(args, options)

    def city_manager(self, args, options):

        self.progress_enabled = not options.get('no-progress')
        self.export = options.get('export')
        self.force = options.get('force')

        if self.export == None:
            self.export = '%s/city_light_%s.txt' % (DATA_DIR,
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

            export_file =  open(file_path, 'a')

        for source in CITY_SOURCES:

            geonames = Geonames(source, force=self.force)

            if not geonames.need_run:
                continue

            i = 0
            self.progress_start(geonames.num_lines())

            if not self.progress_enabled:
                print('Importing...')

            for items in geonames.parse():
                imported = self.city_import(items)

                if self.export and imported:
                    export_file.write('\t'.join(items) + '\n')

                i += 1
                self.progress_update(i)

            self.progress_finish()

            if self.export:
                export_file.close()

            geonames.finish(delete=self.delete)

    def city_import(self, items):
        """
        Import a city to the database
        :param items: row of the source file in geoname table format
        :return: (bool)
        """

        if not items[IGeoname.featureCode] in INCLUDE_CITY_TYPES:
            return False

        try:
            country_id = self._get_country_id(items[IGeoname.countryCode])
        except Country.DoesNotExist:
            raise

        try:
            kwargs = dict(name=items[IGeoname.name],
                          country_id=self._get_country_id(items[IGeoname.countryCode]))
        except Country.DoesNotExist:
            raise

        try:
            try:
                city = City.objects.get(**kwargs)
            except City.MultipleObjectsReturned:
                return False

        except City.DoesNotExist:
            try:
                city = City.objects.get(geoname_id=items[IGeoname.geonameid])
                city.name = items[IGeoname.name]
                city.country_id = self._get_country_id(
                    items[IGeoname.countryCode])
            except City.DoesNotExist:
                city = City(**kwargs)

        save = False

        if not city.latitude:
            city.latitude = items[IGeoname.latitude]
            save = True

        if not city.longitude:
            city.longitude = items[IGeoname.longitude]
            save = True

        if not city.population:
            city.population = items[IGeoname.population]
            save = True

        if not city.feature_code:
            city.feature_code = items[IGeoname.featureCode]
            save = True

        if not city.geoname_id:
            # city may have been added manually
            city.geoname_id = items[IGeoname.geonameid]
            save = True

        if save:
            city.save()
            return True

    def _get_country_id(self, code2):
        '''
        Simple lazy identity map for code2->country
        '''
        if not hasattr(self, '_country_codes'):
            self._country_codes = {}

        if code2 not in self._country_codes.keys():
            self._country_codes[code2] = Country.objects.get(code2=code2).pk
        return self._country_codes[code2]