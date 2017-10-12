/**
 * @file descriptorcachefetcher.js
 * @brief Cache fetcher specialized for descriptors values.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-09-05
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var CacheFetcher = require('../../main/utils/cachefetcher');

var DescriptorCacheFetcher = function() {
    CacheFetcher.call(this);

    this.type = "descriptors";
};

DescriptorCacheFetcher.prototype = Object.create(CacheFetcher.prototype);
DescriptorCacheFetcher.prototype.constructor = DescriptorCacheFetcher;

/**
 * Fetch values.
 * @param keys Keys list.
 */
DescriptorCacheFetcher.prototype.fetch = function(cacheManager, options, keys) {
    var cache = cacheManager.get('descriptors', options.format.name);

    var queryData = {};
    var doFetch = false;

    if (cacheManager.enabled) {
        // make the list of values
        var keysToFetch = new Set();

        var toFetch = false;
        var now = Date.now();

        // lookup into the global cache
        for (var i = 0; i < keys.length; ++i) {
            var key = keys[i];
            var entry = undefined;

            toFetch = false;

            if (key !== null && key !== undefined && key !== "") {
                entry = cache[key];
            }

            if (entry !== undefined) {
                // found. look for validity
                if (entry.expire !== null && entry.expire <= now) {
                    toFetch = true;
                }
            } else if (key !== null && key !== undefined && key !== "") {
                toFetch = true;
            }

            if (toFetch) {
                keysToFetch.add(key);
            }
        }

        doFetch = keysToFetch.size > 0;
        queryData = {values: JSON.stringify(Array.from(keys))};
    } else {
        doFetch = keys.length > 0;
        queryData = {values: JSON.stringify(keys)};
    }

    var url = window.application.url(['descriptor', 'descriptor-model-type', options.format.name]);

    if (doFetch) {
        var promise = $.ajax({
            type: "GET",
            url: url,
            contentType: 'application/json; charset=utf8',
            data: queryData
        });

        promise.done(function (data) {
            // feed the cache and compute expire timestamp. validity of null means it never expires.
            var now = Date.now();
            var expire = data.validity !== null ? data.validity * 1000 + now : null;
            if (!data.cacheable) {
                expire = now;
            }

            // items is a dict
            for (var key in data.items) {
                cache[key] = {
                    expire: expire,
                    value: data.items[key]
                };
            }

            session.logger.debug("Cache miss for descriptor " + options.format.name + ".");
        }).fail(function () {
            session.logger.debug("Cache failure for descriptor " + options.format.name + ".");
        });

        return promise;
    } else {
        return null;
    }
};

DescriptorCacheFetcher.prototype.get = function(cacheManager, options) {
    return cacheManager.get('descriptors', options.format.name);
};

module.exports = DescriptorCacheFetcher;
