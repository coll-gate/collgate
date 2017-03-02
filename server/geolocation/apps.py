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

    def ready(self):

        super().ready()

        instance.geolocation_app = self

        package_name, module_name, class_name = self.get_setting('geolocation_manager').split('.')

        module = import_module(self.name + '.' + package_name + '.' + module_name)

        self.geolocation_manager = module.GeolocationManager()

        from audit.models import register_models
        register_models(CollGateGeolocation.name)

        # create a geolocation module
        geolocation_module = Module('geolocation', base_url='coll-gate')
        geolocation_module.include_urls((
            'base',
            'geolocation_views'
            )
        )

        module_manager.register_module(geolocation_module)
