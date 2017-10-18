/**
 * @file cache.js
 * @brief Global cache manager.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-07-07
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let CacheFetcher = require('./cachefetcher');

let Cache = function() {
    this.data = {};
    this.fetcher = {};
    this.collection = {};
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
            let category = this.data[cacheType];

            if (key in category) {
                return category[key];
            } else {
                let cache = {};
                category[key] = cache;

                return cache;
            }
        } else {
            return null;
        }
    },

    unset: function(cacheType, key) {
        if (cacheType in this.data) {
            let category = this.data[cacheType];

            if (key in category) {
                delete category[key];
            }
        }
    },

    has: function(cacheType, key) {
        if (cacheType in this.data) {
            let category = this.data[cacheType];
            return key in category;
        } else {
            return false;
        }
    },

    /**
     * Invalidate a cache entry.
     * @param cacheType Cache type is a first classification key.
     * @param key Key of the cache to get.
     * @param values null or a list of value or a wild-char.
     */
    invalidate: function(cacheType, key, values) {
        values || (values = null);

        if (cacheType in this.data) {
            let category = this.data[cacheType];
/*
            // @todo maybe collection could be connected to cache or move this like ranks
            if (key.startsWith('languages:')) {
                window.application.main.collections.languages.fetch({reset: true});
                return;
            }*/

            if (values) {
                // @todo an invalidate per value
            } else if (key.startsWith('*')) {
                let match = key.replace('*', '');
                let rmList = [];

                for (key in category) {
                    if (key.endsWith(match)) {
                        rmList.push(key);
                    }
                }

                for (let i = 0; i < rmList.length; ++i) {
                    console.warn("invalidate", cacheType + "__" + rmList[i]);
                    delete category[rmList[i]];
                }

                if (cacheType in this.collection) {
                    for (key in this.collection[cacheType]) {
                        if (key.endsWith(match)) {
                            console.warn("invalidate", cacheType + "__" + key);
                            this.collection[cacheType][key].fetch({reset: true});
                        }
                    }
                }
            } else if (key.endsWith('*')) {
                let match = key.replace('*', '');
                let rmList = [];

                for (key in category) {
                    if (key.startsWith(match)) {
                        rmList.push(key);
                    }
                }

                for (let i = 0; i < rmList.length; ++i) {
                    console.warn("invalidate", cacheType + "__" + rmList[i]);
                    delete category[rmList[i]];
                }

                if (cacheType in this.collection) {
                    for (key in this.collection[cacheType]) {
                        if (key.startsWith(match)) {
                            console.warn("invalidate", cacheType + "__" + key);
                            this.collection[cacheType][key].fetch({reset: true});
                        }
                    }
                }
            } else if (key in category) {
                console.warn("invalidate", cacheType + "__" + key);
                delete category[key];
            }
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
        let cacheType = options.type;

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
        let cacheType = options.type;

        if (cacheType in this.fetcher) {
            let fetcher = this.fetcher[cacheType];

            let deferred = $.Deferred();
            let self = this;

            let promise = fetcher.fetch(this, options, keys);
            if (promise) {
                promise.done(function(data) {
                    deferred.resolve(fetcher.get(self, options));
                });
            } else {
                deferred.resolve(fetcher.get(this, options));
            }

            return deferred.promise();
        } else {
            throw "Unregistered cache fetcher for this type (" + cacheType + ")";
        }
    },

    enable: function () {
        this.enabled = true;
    },

    disable: function () {
        this.enabled = false;
    },

    /**
     * Register a cached collection.
     * @param collection
     */
    registerCollection: function(collection) {
        let cacheInfo = _.isFunction(collection.cache) ? collection.cache() : collection.cache;

        if (cacheInfo.category in this.data) {
            if (cacheInfo.category in this.collection) {
                return;
            }

            if (!(cacheInfo.category in this.collection)) {
                this.collection[cacheInfo.category] = {};
            }

            this.collection[cacheInfo.category][cacheInfo.key] = collection;
        } else {
            throw "Unregistered cache for this type (" + cacheInfo.category + ")";
        }
    }
};

module.exports = Cache;
