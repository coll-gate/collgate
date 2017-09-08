/**
 * @file cache.js
 * @brief Global cache manager.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-07-07
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var CacheFetcher = require('./cachefetcher');

var Cache = function() {
    this.data = {};
    this.fetcher = {};
};

Cache.prototype = {
    /**
     * Register a cache category.
     * @param cacheType Name of the category.
     */
    register: function(cacheType) {
        if (cacheType in this.data) {
            return;
        }

        this.data[cacheType] = {};
    },

    /**
     * Is as cache type previously registered.
     * @param cacheType Name of the category.
     * @returns {boolean}
     */
    hasType: function(cacheType) {
        return cacheType in this.data;
    },

    /**
     * Get a cache from its cache type and key.
     * @param cacheType Cache type is a first classification key.
     * @param key Key of the cache to get.
     * @returns A cache object. It is empty at the first call.
     */
    get: function(cacheType, key) {
        if (cacheType in this.data) {
            var category = this.data[cacheType];

            if (key in category) {
                return category[key];
            } else {
                var cache = {};
                category[key] = cache;

                return cache;
            }
        } else {
            return null;
        }
    },

    unset: function(cacheType, key) {
        if (cacheType in this.data) {
            var category = this.data[cacheType];

            if (key in category) {
                delete category[key];
            }
        }
    },

    has: function(cacheType, key) {
        if (cacheType in this.data) {
            var category = this.data[cacheType];
            return key in category;
        } else {
            return false;
        }
    },

    /**
     * Register a specific cache fetcher.
     * @param fetcher Valid cache fetcher instance.
     */
    registerFetcher: function(fetcher) {
        if (!fetcher || !(fetcher instanceof CacheFetcher)) {
            return;
        }

        if (fetcher.type in this.fetcher) {
            throw "A cache fetcher is already registered with this type (" + fetcher.type + ")";
        }

        this.fetcher[fetcher.type] = fetcher;
    },

    /**
     * If a fetcher is defined for a certain type.
     */
    hasFetcher: function (cacheType) {
        return cacheType in this.fetcher;
    },

    /**
     * Fetch from a specific cache type/value using a fetcher.
     * @param options Cache determination and details.
     * @param keys Keys of value to fetch
     * @return A promise or null
     */
    fetch: function(options, keys) {
        var cacheType = options.type;

        if (cacheType in this.fetcher) {
            return this.fetcher[cacheType].fetch(this, options, keys);
        } else {
            throw "Unregistered cache fetcher for this type (" + cacheType + ")"
        }
    },

    /**
     * Lookup for a single key and return a promise with a data object containing a reference to the key.
     * @param cacheType Cache fetcher type
     * @param format Cache options
     * @param keys Array of keys
     * @returns A promise
     */
    lookup: function(options, keys) {
        var cacheType = options.type;

        if (cacheType in this.fetcher) {
            var fetcher = this.fetcher[cacheType];

            var deferred = $.Deferred();
            var self = this;

            var promise = fetcher.fetch(this, options, keys);
            if (promise) {
                promise.done(function(data) {
                    deferred.resolve(fetcher.get(self, options));
                });
            } else {
                deferred.resolve(fetcher.get(this, options));
            }

            return deferred.promise();
        } else {
            throw "Unregistered cache fetcher for this type (" + cacheType + ")"
        }
    }
};

module.exports = Cache;
