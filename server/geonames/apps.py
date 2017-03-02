# -*- coding: utf-8; -*-
#
# Copyright (c) 2017 INRA UMR1095 GDEC

"""
coll-gate geonames module main
"""

from igdectk.common.apphelpers import ApplicationMain
from igdectk.module.module import Module
from igdectk.module.manager import module_manager

from geolocation.apps import CollGateGeolocation


class CollGateGeonames(ApplicationMain):
    name = '.'.join(__name__.split('.')[0:-1])

    def ready(self):
        super().ready()

        # ignore list from content types
        audit_module = module_manager.get_module('audit')
        audit_module.ignored_content_types += [
            'geonames.'
        ]

        from audit.models import register_models
        register_models(CollGateGeolocation.name)

        # create a geonames module
        geonames_module = Module('geonames', base_url='coll-gate')
        geonames_module.include_urls((
            )
        )

        module_manager.register_module(geonames_module)
