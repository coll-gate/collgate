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

from igdectk.rest.handler import *
from igdectk.rest.response import HttpResponseRest

from .main import RestMain


class RestCache(RestMain):
    regex = r'^cache/$'
    name = 'cache'


@RestCache.def_auth_request(Method.GET, Format.JSON, parameters=('status',))
def get_cache_list(request):
    status = request.GET.get('status', 'valid')

    if status == 'valid':
        results = cache_manager.all()
    elif status == 'expired':
        results = cache_manager.expired()
    else:
        results = {}

    return HttpResponseRest(request, results)


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

    @property
    def expires(self):
        return self.datetime + datetime.timedelta(seconds=self.validity)

    @property
    def content(self):
        return cache.get(self.category + '__' + self.name)

    @content.setter
    def content(self, content):
        self.datetime = datetime.datetime.utcnow()
        cache.set(self.category + '__' + self.name, content, self.validity)


class CacheManager(object):
    """
    Global cache manager and validity.
    @todo surveillance de model :
        descriptortype, descriptorvalue, descriptormodeltype, descriptormetamodel, descriptorpanel
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
        if category in self.categories:
            cache_entry = CacheEntry(category, name, validity)
            self.categories[category][name] = cache_entry

            return cache_entry
        else:
            raise ValueError("Unregistered cache manager category")

    def get(self, category, name):
        if category in self.categories:
            return self.categories[category].get(name, None)
        else:
            raise ValueError("Unregistered cache manager category")

    def unset(self, category, name):
        if category in self.categories:
            del self.categories[category][name]
        else:
            raise ValueError("Unregistered cache manager category")

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


# Singleton of cache
cache_manager = CacheManager()
