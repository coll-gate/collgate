# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
coll-gate medialibrary module main
"""

import os

from django.core.exceptions import ImproperlyConfigured

from igdectk.common.apphelpers import ApplicationMain
from igdectk.module.manager import module_manager
from igdectk.module.module import Module

from . import localsettings


class CollGateMediaLibrary(ApplicationMain):
    name = '.'.join(__name__.split('.')[0:-1])

    def __init__(self, app_name, app_module):
        super(CollGateMediaLibrary, self).__init__(app_name, app_module)

        # different types of format for type of descriptors for this module
        self.format_types = []

    def ready(self):
        super().ready()

        # some local settings
        storage_path = self.get_setting('storage_path')
        if not os.path.isabs(storage_path):
            localsettings.storage_path = os.path.abspath(storage_path)
        else:
            localsettings.storage_path = storage_path

        if not os.path.isdir(localsettings.storage_path):
            raise ImproperlyConfigured("Media library destination folder misconfiguration")

        localsettings.storage_location = self.get_setting('storage_location')
        localsettings.max_file_size = self.get_setting('max_file_size')

        if not isinstance(localsettings.max_file_size, int):
            raise ImproperlyConfigured("Max file size must be an integer")

        if localsettings.max_file_size <= 1024:
            raise ImproperlyConfigured("Max file size must be greater than 1024")

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

        module_manager.register_module(media_library_module)
