# -*- coding: utf-8; -*-
#
# @file cache.py
# @brief Cache API and rest handler.
# @author Frédéric SCHERMA (INRA UMR1095)
# @date 2017-07-12
# @copyright Copyright (c) 2017 INRA/CIRAD
# @license MIT (see LICENSE file)
# @details

import datetime

from django.core.cache import cache

# @todo update for REDIS, and follow models changes


class CacheEntry(object):
    """
    Cache object entry.
    """

    DEFAULT_VALIDITY = 60*60*3   # 3 minutes

    def __init__(self, category, name, validity=None):
        self.category = category
        self.name = name
        self.datetime = datetime.datetime.utcnow()
        self.validity = validity if validity is not None else CacheEntry.DEFAULT_VALIDITY

    def __del__(self):
        if cache:
            cache.set("%s__%s" % (self.category, self.name), None)
            # @todo send a notification on messaging service to CacheWebService

    @property
    def expires(self):
        return self.datetime + datetime.timedelta(seconds=self.validity)

    @property
    def content(self):
        return cache.get("%s__%s" % (self.category, self.name))

    @content.setter
    def content(self, content):
        self.datetime = datetime.datetime.utcnow()
        cache.set("%s__%s" % (self.category, self.name), content, self.validity)
        # @todo send a notification on messaging service to CacheWebService


class CacheManager(object):
    """
    Global cache manager and validity.
    @todo surveillance de model :
        descriptortype, descriptorvalue, descriptormodeltype, descriptormetamodel, descriptorpanel,
        classification...
    """

    def __init__(self):
        self.categories = {}

        self._expired = CacheEntry('_expired', 1)
        self._all = CacheEntry('_all', 1)

    def register(self, category):
        if category not in self.categories:
            self.categories[category] = {}

    def set(self, category, name, validity=None):
        """
        Set a cache object.

        :param category: Name of the category (must be previously registered)
        :param name: Key name of the cache.
        :param validity: During in seconds of the validity of the cache.
        :return:
        """
        cache_category = self.categories.get(category)

        if cache_category is None:
            raise ValueError("Unregistered cache manager category")

        cache_entry = CacheEntry(category, name, validity)
        cache_category[name] = cache_entry

        return cache_entry

    def get(self, category, name):
        cache_category = self.categories.get(category)

        if cache_category is None:
            raise ValueError("Unregistered cache manager category")

        return cache_category.get(name)

    def unset(self, category, name):
        cache_category = self.categories.get(category)

        if cache_category is None:
            raise ValueError("Unregistered cache manager category")

        if name.endswith('*'):
            match = name.rstrip('*')
            rm_list = []

            for cache_entry in cache_category:
                if cache_entry.startswith(match):
                    rm_list.append(cache_entry)

            for cache_entry in rm_list:
                del cache_category[cache_entry]

        elif name.startswith('*'):
            match = name.lstrip('*')
            rm_list = []

            for cache_entry in cache_category:
                if cache_entry.endswith(match):
                    rm_list.append(cache_entry)

            for cache_entry in rm_list:
                del cache_category[cache_entry]

        elif name in cache_category:
            del cache_category[name]

    def content(self, category, name):
        cache_category = self.categories.get(category)

        if cache_category is None:
            raise ValueError("Unregistered cache manager category")

        cache_entry = cache_category.get(name)
        if cache_entry:
            return cache_entry.content
        else:
            return None

    def all(self):
        """
        Convert the structure of the manager to a dict.
        """
        categories = self._all.content

        if categories is not None:
            return categories

        categories = {}

        for category in self.categories:
            cat = {}

            for entry in category:
                cat[entry.name] = {
                    'status': 'valid',
                    'datetime': entry.datetime,
                    'validity': entry.validity,
                    'expires': entry.expires
                }

            categories = cat

        # keep result in for a short time
        self._all.content = categories

        return categories

    def expired(self):
        """
        Returns as a dict structure all expired caches.
        """
        categories = self._expired.content

        if categories is not None:
            return categories

        categories = {}

        for category in self.categories:
            cat = {}

            for entry in category:
                if entry.expires <= datetime.datetime.utcnow():
                    cat[entry.name] = {
                        'status': 'invalid',
                        'datetime': entry.datetime,
                        'validity': entry.validity,
                        'expires': entry.expires
                    }

            categories = cat

        # keep result in for a short time
        self._expired.content = categories

        return categories

    def make_cache_name(self, *kargs):
        return ":".join(kargs)


# Singleton of cache
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

            response = cache_manager.content(category, key_name)
            if not response:
                response = func(*args, **kwargs)
                cache_manager.set(category, key_name, cache_timeout).content = response
            return response
        return foo
    return wrapper
