# -*- coding: utf-8 -*-

"""Compile PO getext to MO files for serve apps (html and py).
"""

import os

from django.conf import settings
from django.core.management.base import BaseCommand
from django.core.management import call_command


class Command(BaseCommand):
    help = "Compile PO getext to MO files for serve apps (html and py)."

    def add_arguments(self, parser):
        parser.add_argument('app_name', nargs='*', type=str)

    def handle(self, *args, **options):
        base_path = os.path.join(settings.BASE_DIR)
        os.chdir(base_path)

        for ldir in os.listdir():
            if os.path.isdir(ldir):

                if len(options['app_name']) > 0 and ldir not in options['app_name']:
                    continue

                if os.path.exists(os.path.join(ldir, 'locale')):
                    os.chdir(ldir)
                    print("processing compilemessage on %s for any locale %s" % (os.getcwd(), ldir))
                    call_command('compilemessages', verbosity=0)

                    os.chdir('..')