# -*- coding: utf-8; -*-
#
# @file translation.py
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
from geonames.appsettings import TRANSLATION_SOURCES, TRANSLATION_LANGUAGES, IAlternate, DATA_DIR
from geonames.models import AlternateName, Country, City, ContentType
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
    help = """Download all files in GEONAMES_TRANSLATION_SOURCES if they were updated or if
    --force option was used.
    And Import translation data if they were downloaded."""

    def __init__(self):
        super(Command, self).__init__()
        self.no_color = None
        self.verbosity = None
        self.export_file = None
        self.progress_enabled = False
        self.progress_widgets = None
        self.progress = 0
        self.force = False
        self.export = False
        self.delete = False

        self.city_content_type_id = ContentType.objects.get_by_natural_key('geonames', 'city').id
        self.country_content_type_id = ContentType.objects.get_by_natural_key('geonames', 'country').id

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

        self.translation_manager(args, options)

    def translation_manager(self, args, options):

        self.progress_enabled = not options.get('no-progress')
        self.export = options.get('export')
        self.force = options.get('force')
        self.verbosity = options.get('verbosity')
        self.no_color = options.get('no_color')

        if self.export is None:
            self.export = '%s/alt_name_light_%s.txt' % (DATA_DIR,
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

        for source in TRANSLATION_SOURCES:

            geonames = Geonames(source, force=self.force)

            if not geonames.need_run:
                continue

            i = 0
            self.progress_start(geonames.num_lines())

            if not self.progress_enabled:
                print('Importing...')

            alt_names_to_check = []

            for items in geonames.parse():
                current_alt_name = self.translation_check(items)

                i += 1
                self.progress_update(i)

                if current_alt_name:
                    alt_names_to_check.append(current_alt_name)

                if len(alt_names_to_check) >= 500:
                    self.translation_bulk(alt_names_to_check)
                    alt_names_to_check = []

            if alt_names_to_check:
                self.translation_bulk(alt_names_to_check)
            self.progress_finish()

            if self.export:
                self.export_file.close()

            geonames.finish(delete=self.delete)

    @staticmethod
    def translation_check(items):

        if items[IAlternate.language] not in TRANSLATION_LANGUAGES:
            return False

        size = len(items)

        if size > IAlternate.isHistoric and items[IAlternate.isHistoric] == "1":
            return False

        if size > IAlternate.isColloquial and items[IAlternate.isColloquial] == "1":
            return False

        if size > IAlternate.isPreferred and items[IAlternate.isPreferred] == "1":
            is_preferred = True
        else:
            is_preferred = False

        if size > IAlternate.isShort and items[IAlternate.isShort] == "1":
            is_short = True
        else:
            is_short = False

        return {
            'name_id': items[IAlternate.nameid],
            'geoname_id': int(items[IAlternate.geonameid]),
            'language': items[IAlternate.language],
            'alternate_name': items[IAlternate.name],
            'is_preferred_name': is_preferred,
            'is_short_name': is_short
        }

    def translation_bulk(self, alt_names_to_check):

        bulk = []
        geonameid_list = set(x.get('geoname_id') for x in alt_names_to_check)
        suspect_cities = {x[1]: x[0] for x in City.objects.filter(geoname_id__in=geonameid_list).values_list('id', 'geoname_id')}
        suspect_countries = {x[1]: x[0] for x in Country.objects.filter(geoname_id__in=geonameid_list).values_list('id', 'geoname_id')}

        for alt_name in alt_names_to_check:
            if alt_name.get('geoname_id') in suspect_cities:
                is_city_or_country = True
            elif alt_name.get('geoname_id') in suspect_countries:
                is_city_or_country = False
            else:
                continue

            result = AlternateName.objects.filter(alt_name_id=alt_name.get('name_id'))
            if result:
                result[0].content_type_id = self.city_content_type_id if is_city_or_country else self.country_content_type_id
                result[0].object_id = suspect_cities[alt_name.get('geoname_id')] if is_city_or_country else suspect_countries[alt_name.get('geoname_id')]
                result[0].language = alt_name.get('language')
                result[0].alternate_name = alt_name.get('alternate_name')
                result[0].is_preferred_name = alt_name.get('is_preferred_name')
                result[0].is_short_name = alt_name.get('is_short_name')
                result[0].save()

                translation = result[0]

            else:
                translation = AlternateName(
                    alt_name_id=alt_name.get('name_id'),
                    content_type_id=self.city_content_type_id if is_city_or_country else self.country_content_type_id,
                    object_id=suspect_cities[alt_name.get('geoname_id')] if is_city_or_country else suspect_countries[alt_name.get('geoname_id')],
                    language=alt_name.get('language'),
                    alternate_name=alt_name.get('alternate_name'),
                    is_preferred_name=alt_name.get('is_preferred_name'),
                    is_short_name=alt_name.get('is_short_name')
                )

                bulk.append(translation)

            if self.export:

                r = list(range(6))
                r[IAlternate.nameid] = alt_name.get('name_id')
                r[IAlternate.geonameid] = str(alt_name.get('geoname_id'))
                r[IAlternate.language] = alt_name.get('language')
                r[IAlternate.name] = alt_name.get('alternate_name')
                r[IAlternate.isPreferred] = '1' if alt_name.get('is_preferred_name') else '0'
                r[IAlternate.isShort] = '1' if alt_name.get('is_short_name') else '0'

                self.export_file.write('\t'.join(r) + '\n')

            self.display_entry_message(translation, True if result else False)

        if bulk:
            AlternateName.objects.bulk_create(bulk)
            self.display_bulk_message(len(bulk))

    def display_bulk_message(self, bulk_size):
        if not self.progress_enabled and self.verbosity:
            print('BULK INSERT!\tNb_entries:%s' % bulk_size)

    def display_entry_message(self, alt_name, state):
        if not self.progress_enabled and self.verbosity:
            display_state = "UPDATED" if state else "ADD"
            if not self.no_color:
                display_state = (Fore.BLUE if state else Fore.GREEN) + display_state + Style.RESET_ALL
            print('[%s] %s' % (display_state, alt_name))


