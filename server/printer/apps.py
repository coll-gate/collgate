# -*- coding: utf-8; -*-
#
# @file apps
# @brief collgate 
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2018-09-20
# @copyright Copyright (c) 2018 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

from django.utils.translation import ugettext_lazy as _

from igdectk.bootstrap.customglyph import FaGlyph
from igdectk.common.apphelpers import ApplicationMain
from igdectk.module import AUTH_STAFF
from igdectk.module.manager import module_manager
from igdectk.module.menu import MenuEntry, MenuSeparator
from igdectk.module.module import Module, ModuleMenu


class CollGatePrinter(ApplicationMain):
    name = '.'.join(__name__.split('.')[0:-1])

    def ready(self):
        super().ready()

        # create a module printer
        printer_module = Module('printer', base_url='coll-gate')
        printer_module.include_urls((
            'base',
            )
        )

        # no client counterpart
        printer_module.client_export = False

        module_manager.register_module(printer_module)
