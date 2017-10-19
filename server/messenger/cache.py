# -*- coding: utf-8; -*-
#
# @file cache
# @brief collgate 
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2017-10-19
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details 

from .commands import COMMAND_CACHE_INVALIDATION


class ClientCacheManager:

    def __init__(self):
        self.categories = {}
        self.messenger_module = None

    def bind(self):
        from igdectk.module.manager import module_manager
        self.messenger_module = module_manager.get_module('messenger')

    def register(self, category):
        if category not in self.categories:
            self.categories[category] = {}

    def delete(self, category, name, values=None):
        cache_category = self.categories.get(category)

        if cache_category is None:
            raise ValueError("Unregistered client cache manager category")

        self.messenger_module.tcp_client.message(COMMAND_CACHE_INVALIDATION, {
            'category': category, 'name': name, 'values': values})


# Singleton of client cache manager (init by apps)
client_cache_manager = ClientCacheManager()
