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

    def __init__(self, app_name, app_module):
        super(CollGateMediaLibrary, self).__init__(app_name, app_module)

        # different types of format for type of descriptors for this module
        self.format_types = []

    def ready(self):
        super().ready()

        # create a module medialibrary
        media_library_module = Module('medialibrary', base_url='coll-gate')
        media_library_module.include_urls((
            'base',
            'media'
            )
        )

        # registers media types of formats
        from . import descriptorformattype

        self.format_types += [
            descriptorformattype.DescriptorFormatTypeMedia(),
            descriptorformattype.DescriptorFormatTypeMediaCollection()
        ]

        from descriptor.descriptorformattype import DescriptorFormatTypeManager
        DescriptorFormatTypeManager.register(self.format_types)

        module_manager.register_menu(media_library_module)
