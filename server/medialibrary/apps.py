# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
coll-gate medialibrary module main
"""

from igdectk.common.apphelpers import ApplicationMain
from igdectk.module.manager import module_manager
from igdectk.module.module import Module


class CollGateMediaLibrary(ApplicationMain):
    name = '.'.join(__name__.split('.')[0:-1])

    def ready(self):
        super().ready()

        # create a module medialibrary
        media_library_module = Module('medialibrary', base_url='coll-gate')
        media_library_module.include_urls((
            'base',
            )
        )

        module_manager.register_menu(media_library_module)
