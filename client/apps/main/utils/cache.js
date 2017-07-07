/**
 * @file cache.js
 * @brief Global cache manager.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-07-07
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var Cache = function() {
    this.data = {};
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
    }
};

module.exports = Cache;
