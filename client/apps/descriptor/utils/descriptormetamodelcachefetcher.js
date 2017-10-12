/**
 * @file descriptormetamodelcachefetcher.js
 * @brief Cache fetcher specialized for descriptor meta model.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-09-05
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var CacheFetcher = require('../../main/utils/cachefetcher');

var DescriptorMetaModelCacheFetcher = function() {
    CacheFetcher.call(this);

    this.type = "descriptor_meta_model";
};

DescriptorMetaModelCacheFetcher.prototype = Object.create(CacheFetcher.prototype);
DescriptorMetaModelCacheFetcher.prototype.constructor = DescriptorMetaModelCacheFetcher;

/**
 * Fetch values.
 * @param keys Keys list.
 */
DescriptorMetaModelCacheFetcher.prototype.fetch = function(cacheManager, options, keys) {
    // make the list of values
    var keysToFetch = new Set();

    var cache = cacheManager.get('descriptor_meta_model', options.format.model);
    var toFetch = false;
    var now = Date.now();

    if (cacheManager.enabled) {
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
    } else {
        // all when cache disabled
        keysToFetch = new Set(keys);
    }

    var url = window.application.url(['descriptor', 'meta-model', 'values']);
    var queryData = {
        values: JSON.stringify(Array.from(keysToFetch))
    };

    if (keysToFetch.size) {
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

            session.logger.debug("Cache miss for descriptor meta model " + options.format.model + ".");
        }).fail(function () {
           session.logger.debug("Cache failure for descriptor meta model " + options.format.model + ".");
        });

        return promise;
    } else {
        return null;
    }
};

DescriptorMetaModelCacheFetcher.prototype.get = function(cacheManager, options) {
    return cacheManager.get('descriptor_meta_model', options.format.model);
};

module.exports = DescriptorMetaModelCacheFetcher;
