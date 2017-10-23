# -*- coding: utf-8; -*-
#
# @file cache.py
# @brief Cache API and rest handler.
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2017-07-12
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details

from django.core.cache import cache
from django.conf import settings


class CacheManager(object):
    """
    Helper in front of cache API. Models are watched using django signals.
    """

    def __init__(self):
        self.categories = {}

    def setup(self):
        if getattr(settings, 'PURGE_SERVER_CACHE', False):
            self.purge()

    def register(self, category):
        if category not in self.categories:
            self.categories[category] = {}

    def set(self, category, name, content, validity=None):
        """
        Set a cache object.

        :param category: Name of the category (must be previously registered)
        :param name: Key name of the cache.
        :param content: Cache content.
        :param validity: During in seconds of the validity of the cache.
        :return:
        """
        cache_category = self.categories.get(category)

        if cache_category is None:
            raise ValueError("Unregistered cache manager category")

        cache.set("%s__%s" % (category, name), content, validity)

    def delete(self, category, name):
        """
        Delete a cache entry.
        :param category: Prefix
        :param name: Name can contains wild-char
        """
        cache_category = self.categories.get(category)

        if cache_category is None:
            raise ValueError("Unregistered cache manager category")

        if '*' in name:
            cache.delete_pattern("%s__%s" % (category, name))
        else:
            cache.delete("%s__%s" % (category, name))

    def get(self, category, name):
        cache_category = self.categories.get(category)

        if cache_category is None:
            raise ValueError("Unregistered cache manager category")

        return cache.get("%s__%s" % (category, name))

    def get_or_set(self, category, name, default, validity):
        cache_category = self.categories.get(category)

        if cache_category is None:
            raise ValueError("Unregistered cache manager category")

        return cache.get_or_set("%s__%s" % (category, name), default, validity)

    def make_cache_name(self, *kargs):
        return ":".join(kargs)

    def purge(self):
        cache.delete_pattern("*")
        # for category in self.categories:
        #     cache.delete_pattern("%s__*" % category)


# Singleton of server cache manager
cache_manager = CacheManager()


def named_cache(category, name, cache_timeout):
    """
    Decorator for views that tries getting the page from the cache and
    populates the cache if the page isn't in the cache yet.

    The cache name have replacement characters :
      - {0} : replaced by request.path
      - any other named parameter formatted like %(param_name)s
    """
    def wrapper(func):
        def foo(*args, **kwargs):
            if isinstance(name, str):
                key_name = name.replace('{0}', args[0].path) % kwargs
            else:
                key_name = name(kwargs)

            response = cache_manager.get(category, key_name)
            if not response:
                response = func(*args, **kwargs)
                cache_manager.set(category, key_name, response, cache_timeout)
            return response
        return foo
    return wrapper
