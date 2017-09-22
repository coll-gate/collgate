# -*- coding: utf-8; -*-
#
# @file compile_client_messages.py
# @brief Compile PO getext to MO files for client apps (html and js).
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2016-09-01
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

import os
import subprocess

from django.core.management.base import BaseCommand
from django.conf import settings


class Command(BaseCommand):
    """Deprecated command since using i18next-scanner and full toolchain"""

    help = "Compile PO getext to MO files for client apps (html and js)."

    def add_arguments(self, parser):
        parser.add_argument('app_name', nargs='*', type=str)

    def handle(self, *args, **options):
        print("Deprecated: no need to compile client messages since migration to i18next-scanner and toolchain")
        return

        # base_path = os.path.join(settings.BASE_DIR, '..', 'client', 'apps')
        # os.chdir(base_path)
        #
        # # get local npm .bin path
        # cmd = 'npm bin'
        # process = subprocess.Popen(cmd.split(), stdout=subprocess.PIPE)
        # npm_bin = process.communicate()[0].decode('utf-8').rstrip('\n')
        #
        # for ldir in os.listdir():
        #     if os.path.isdir(ldir):
        #
        #         if len(options['app_name']) > 0 and ldir not in options['app_name']:
        #             continue
        #
        #         os.chdir(os.path.join(ldir, 'locale'))
        #
        #         for sdir in os.listdir():
        #             if os.path.isdir(sdir) and os.path.exists(os.path.join(sdir, 'LC_MESSAGES')):
        #                 os.chdir(os.path.join(sdir, 'LC_MESSAGES'))
        #                 cmd = 'msgfmt -o default.mo default.po'
        #                 process = subprocess.Popen(cmd.split(), stdout=subprocess.PIPE)
        #                 output = process.communicate()[0]
        #
        #                 print("msgfmt on %s for local %s" % (os.getcwd(), sdir))
        #
        #                 cmd = 'node %s -l default -s default.po -t default.json --skipUntranslated' % (os.path.join(npm_bin, 'i18next-conv'))
        #                 process = subprocess.Popen(cmd.split(), stdout=subprocess.PIPE)
        #                 output = process.communicate()[0]
        #
        #                 print("i18next-conv on %s for local %s" % (os.getcwd(), sdir))
        #                 os.chdir("../..")
        #
        #         os.chdir("../..")
