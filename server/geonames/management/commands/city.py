# -*- coding: utf-8 -*-

"""
Install City
"""

from django.db import transaction
from django.core.management import BaseCommand
from geonames.appsettings import CITY_SOURCES, IGeoname, DATA_DIR
from geonames import instance
from geonames.models import City, Country
from geonames.geonames import Geonames

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
    help = """Download all files in GEONAMES_CITY_SOURCES if they were updated or if
    --force option was used.
    And Import city data if they were downloaded."""

    def __init__(self):
        super(Command, self).__init__()
        self.progress_enabled = False
        self.progress_widgets = None
        self.progress = 0
        self.force = False
        self.export_file = None
        self.export = False
        self.delete = False
        self.verbosity = None
        self.no_color = None
        self.cities_bulk = []

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

        self.city_manager(args, options)

    def city_manager(self, args, options):

        self.progress_enabled = not options.get('no-progress')
        self.export = options.get('export')
        self.force = options.get('force')
        self.verbosity = options.get('verbosity')
        self.no_color = options.get('no_color')

        if self.export is None:
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

            self.export_file = open(file_path, 'a')

        for source in CITY_SOURCES:

            geonames = Geonames(source, force=self.force)

            if not geonames.need_run:
                continue

            i = 0
            self.progress_start(geonames.num_lines())

            if not self.progress_enabled:
                print('Importing...')

            cities_to_check = []

            for items in geonames.parse():
                current_city = self.city_check(items)

                i += 1
                self.progress_update(i)

                if current_city:
                    cities_to_check.append(current_city)

                if len(cities_to_check) >= 500:
                    self.city_bulk(cities_to_check)
                    cities_to_check = []

            if cities_to_check:
                self.city_bulk(cities_to_check)
            self.progress_finish()

            if self.export:
                self.export_file.close()

            geonames.finish(delete=self.delete)

    def city_check(self, items):
        if not items[IGeoname.featureCode] in instance.geonames_include_city_types:
            return False

        return {
            'geoname_id': int(items[IGeoname.geonameid]),
            'name': items[IGeoname.name],
            'country_code': items[IGeoname.countryCode],
            'country_id': self._get_country_id(items[IGeoname.countryCode]),
            'latitude': items[IGeoname.latitude],
            'longitude': items[IGeoname.longitude],
            'population': items[IGeoname.population],
            'feature_code': items[IGeoname.featureCode]
        }

    def city_bulk(self, cities_to_check):
        bulk = []
        for city in cities_to_check:
            result = City.objects.filter(geoname_id=city.get('geoname_id'))
            if result:
                result[0].name = city.get('name')
                result[0].country_id = city.get('country_id')
                result[0].latitude = city.get('latitude')
                result[0].longitude = city.get('longitude')
                result[0].population = city.get('population')
                result[0].feature_code = city.get('feature_code')
                result[0].save()

                town = result[0]

            else:
                town = City(
                    geoname_id=city.get('geoname_id'),
                    name=city.get('name'),
                    country_id=city.get('country_id'),
                    latitude=city.get('latitude'),
                    longitude=city.get('longitude'),
                    population=city.get('population'),
                    feature_code=city.get('feature_code')
                )

                bulk.append(town)

            if self.export:
                r = [""] * 18
                r[IGeoname.name] = city.get('name')
                r[IGeoname.countryCode] = city.get('country_code')
                r[IGeoname.latitude] = city.get('latitude')
                r[IGeoname.longitude] = city.get('longitude')
                r[IGeoname.population] = city.get('population')
                r[IGeoname.featureCode] = city.get('feature_code')
                r[IGeoname.geonameid] = str(city.get('geoname_id'))

                self.export_file.write('\t'.join(r) + '\n')

            self.display_entry_message(town, True if result else False)

        if bulk:
            City.objects.bulk_create(bulk)
            self.display_bulk_message(len(bulk))

    def _get_country_id(self, code2):
        """
        Simple lazy identity map for code2->country
        """
        if not hasattr(self, '_country_codes'):
            self._country_codes = {}

        if code2 not in self._country_codes.keys():
            self._country_codes[code2] = Country.objects.get(code2=code2).pk
        return self._country_codes[code2]

    def display_bulk_message(self, bulk_size):
        if not self.progress_enabled and self.verbosity:
            print('BULK INSERT!\tNb_entries:%s' % bulk_size)

    def display_entry_message(self, city, state):
        if not self.progress_enabled and self.verbosity:
            display_state = "UPDATED" if state else "ADD"
            if not self.no_color:
                display_state = (Fore.BLUE if state else Fore.GREEN) + display_state + Style.RESET_ALL
            print('[%s] %s' % (display_state, city))
