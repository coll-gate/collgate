# -*- coding: utf-8; -*-
#
# @file apps.py
# @brief 
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2016-09-01
# @copyright Copyright (c) 2016 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details coll-gate medialibrary module main

import os

import sys
from django.core.exceptions import ImproperlyConfigured

from igdectk.common.apphelpers import ApplicationMain
from igdectk.module.manager import module_manager
from igdectk.module.module import Module
from main.config import configuration

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
            configuration.wrong(
                "medialibrary",
                "Media-library destination path", "Media library destination folder does not exists.")
        else:
            configuration.validate(
                "medialibrary",
                "Media-library destination path",
                "Media library destination folder founds at %s." % localsettings.storage_path)

        localsettings.storage_location = self.get_setting('storage_location')
        localsettings.max_file_size = self.get_setting('max_file_size')

        if not isinstance(localsettings.max_file_size, int):
            configuration.wrong("medialibrary", "Media-library max file size", "Max file size must be an integer.")

        if localsettings.max_file_size <= 1024:
            configuration.wrong("medialibrary",
                                "Media-library max file size",
                                "Max file size must be greater than 1024 bytes.")
        else:
            configuration.validate("medialibrary",
                                   "Media-library max file size",
                                   "Max file size is %i bytes." % localsettings.max_file_size)

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
