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
from . import instance
from main.config import configuration


class CollGateGeonames(ApplicationMain):
    name = '.'.join(__name__.split('.')[0:-1])

    def __init__(self, app_name, app_module):
        super(CollGateGeonames, self).__init__(app_name, app_module)
        self.geonames_username = None
        self.geonames_include_city_types = None

    def ready(self):
        super().ready()

        instance.geonames_app = self

        self.geonames_username = self.get_setting('geonames_username')

        if self.geonames_username == 'demo' or not self.geonames_username:
            configuration.wrong('geonames',
                                'geonames_username',
                                "Geonames username invalid : %s" % self.geonames_username)

        else:
            configuration.validate('geonames',
                                   'geonames_username',
                                   "Geonames username found : %s" % self.geonames_username)

        self.geonames_include_city_types = self.get_setting('geonames_include_city_types')

        geonames_features_code = ['PPL', 'PPLA', 'PPLA2', 'PPLA3', 'PPLA4', 'PPLC', 'PPLCH',
                                  'PPLF', 'PPLG', 'PPLH', 'PPLL', 'PPLQ', 'PPLR', 'PPLS', 'PPLW',
                                  'PPLX', 'STLMT']

        codes_supported = True
        for code in self.geonames_include_city_types:
            if code not in geonames_features_code:
                codes_supported = False
                break

        if not codes_supported:
            configuration.wrong('geonames',
                                'geonames_include_city_types',
                                "City types not supported")
        else:
            configuration.validate('geonames',
                                   'geonames_include_city_types',
                                   "City types supported : FeatureCode -> %s " % self.geonames_include_city_types)

        instance.geonames_include_city_types = self.geonames_include_city_types
        instance.geonames_username = self.geonames_username

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

        # no client counterpart
        geonames_module.client_export = False

        module_manager.register_module(geonames_module)
