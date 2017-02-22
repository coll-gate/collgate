# -*- coding: utf-8; -*-
#
# Copyright (c) 2016 INRA UMR1095 GDEC

"""
coll-gate geonames module main
"""

from igdectk.common.apphelpers import ApplicationMain
from igdectk.module.module import Module


class CollGateGeonames(ApplicationMain):
    name = '.'.join(__name__.split('.')[0:-1])

    def ready(self):

        super().ready()

        from audit.models import register_models
        register_models(CollGateGeolocation.name)

        # create a geonames module
        geolocation_module = Module('geonames', base_url='coll-gate')
        geolocation_module.include_urls((
            'base'
            )
        )