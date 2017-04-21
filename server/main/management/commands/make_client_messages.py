# -*- coding: utf-8; -*-
#
# @file make_client_messages.py
# @brief 
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2016-09-01
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

"""Build PO gettext files for client apps (html and js).
"""

import os
import subprocess

from django.conf import settings
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Build PO gettext files for client apps (html and js)."

    def add_arguments(self, parser):
        parser.add_argument('app_name', nargs='*', type=str)

    def handle(self, *args, **options):
        base_path = os.path.join(settings.BASE_DIR, '..', 'client', 'apps')
        os.chdir(base_path)

        # get local npm .bin path
        cmd = 'npm bin'
        process = subprocess.Popen(cmd.split(), stdout=subprocess.PIPE)
        npm_bin = process.communicate()[0].decode('utf-8').rstrip('\n')

        for ldir in os.listdir():
            if os.path.isdir(ldir):

                if len(options['app_name']) > 0 and ldir not in options['app_name']:
                    continue

                os.chdir(os.path.join(ldir, 'locale'))

                for sdir in os.listdir():
                    if os.path.isdir(sdir) and os.path.exists(os.path.join(sdir, 'LC_MESSAGES')):
                        os.chdir(os.path.join(sdir, 'LC_MESSAGES'))

                        cmd = 'node %s -l default -e "js,html" -d ../../../' % (os.path.join(npm_bin, 'make-gettext'),)
                        process = subprocess.Popen(cmd.split(), stdout=subprocess.PIPE)
                        output = process.communicate()[0]

                        if os.path.exists("default.po~"):
                            os.remove("default.po~")

                        print("make-gettext on %s for locale %s" % (os.getcwd(), sdir))
                        os.chdir("../..")

                os.chdir("../..")

