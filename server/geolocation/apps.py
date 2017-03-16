# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
coll-gate geolocation module main
"""

from igdectk.common.apphelpers import ApplicationMain
from igdectk.module.module import Module

from importlib import import_module
from igdectk.module.manager import module_manager

from . import instance


class CollGateGeolocation(ApplicationMain):
    name = '.'.join(__name__.split('.')[0:-1])
    geolocation_manager = None

    def __init__(self, app_name, app_module):
        super(CollGateGeolocation, self).__init__(app_name, app_module)

        # different types of format for type of descriptors for this module
        self.format_types = []

    def ready(self):

        super().ready()

        instance.geolocation_app = self

        package_name, module_name, class_name = self.get_setting('geolocation_manager').split('.')

        module = import_module(self.name +'.'+ package_name + '.' + module_name)

        self.geolocation_manager = module.GeolocationManager()

        # create a geolocation module
        geolocation_module = Module('geolocation', base_url='coll-gate')
        geolocation_module.include_urls((
            'base',
            'geolocation_views'
            )
        )

        # registers media types of formats
        from . import descriptorformattype

        self.format_types += [
            descriptorformattype.DescriptorFormatTypeGeolocation(),
            descriptorformattype.DescriptorFormatTypeCountry(),
            descriptorformattype.DescriptorFormatTypeCity(),
        ]

        from descriptor.descriptorformattype import DescriptorFormatTypeManager
        DescriptorFormatTypeManager.register(self.format_types)

        module_manager.register_menu(geolocation_module)