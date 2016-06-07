# -*- coding: utf-8 -*-

"""Compile PO getext to MO files for client apps (html and js).
"""

import os
import subprocess

from django.core.management.base import BaseCommand
from django.conf import settings


class Command(BaseCommand):
    help = "Compile PO getext to MO files for client apps (html and js)."

    def add_arguments(self, parser):
        parser.add_argument('app_name', nargs='*', type=str)

    def handle(self, *args, **options):
        base_path = os.path.join(settings.BASE_DIR, '..', 'client', 'apps')
        os.chdir(base_path)

        for ldir in os.listdir():
            if os.path.isdir(ldir):

                if len(options['app_name']) > 0 and ldir not in options['app_name']:
                    continue

                os.chdir(os.path.join(ldir, 'locale'))

                for sdir in os.listdir():
                    if os.path.isdir(sdir) and os.path.exists(os.path.join(sdir, 'LC_MESSAGES')):
                        os.chdir(os.path.join(sdir, 'LC_MESSAGES'))
                        cmd = 'msgfmt -o default.mo default.po'
                        process = subprocess.Popen(cmd.split(), stdout=subprocess.PIPE)
                        output = process.communicate()[0]

                        print("msgfmt on %s for local %s" % (os.getcwd(), sdir))
                        os.chdir("../..")

                os.chdir("../..")
