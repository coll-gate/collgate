# -*- coding: utf-8; -*-
#
# @file apps.py
# @brief coll-gate messenger module main
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2017-10-06
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details

from igdectk.common.apphelpers import ApplicationMain
from igdectk.module.manager import module_manager
from igdectk.module.module import Module

from . import tcpclient


class CollGateMessenger(ApplicationMain):
    name = '.'.join(__name__.split('.')[0:-1])

    def __init__(self, app_name, app_module):
        super(CollGateMessenger, self).__init__(app_name, app_module)

    def ready(self):
        super().ready()

        # register main cache category
        from main.cache import cache_manager
        cache_manager.register('messenger')

        messenger_module = Module('messenger', base_url='coll-gate')
        messenger_module.include_urls((
            'base',
        ))

        module_manager.register_module(messenger_module)

        if self.is_run_mode():
            self.post_ready()

    def post_ready(self):
        messenger_module = module_manager.get_module('messenger')

        # no client counterpart
        messenger_module.client_export = False

        # create a connector to messenger service
        messenger_module.tcp_client = tcpclient.TCPClient()
        messenger_module.tcp_client.daemon = True
