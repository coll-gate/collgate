/**
 * @file entitycachefetcher.js
 * @brief Cache fetcher specialized for entity display value.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-09-05
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let CacheFetcher = require('./cachefetcher');

let EntityCacheFetcher = function() {
    CacheFetcher.call(this);

    this.type = "entity";
};

EntityCacheFetcher.prototype = Object.create(CacheFetcher.prototype);
EntityCacheFetcher.prototype.constructor = EntityCacheFetcher;

EntityCacheFetcher.prototype.fetch = function(cacheManager, options, keys) {
    // make the list of values
    let keysToFetch = new Set();

    let cache = cacheManager.get('entity', options.format.model);
    let toFetch = false;
    let now = Date.now();

    if (cacheManager.enabled) {
        // lookup into the global cache
        for (let i = 0; i < keys.length; ++i) {
            let key = keys[i];
            let entry = undefined;

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

    let url = "";
    let queryData = {values: JSON.stringify(Array.from(keys))};

    if (options.format.details) {
        url = window.application.url(['main', 'entity', options.format.model, 'details']);
    } else {
        url = window.application.url(['main', 'entity', options.format.model, 'values']);
    }

    if (keysToFetch.size) {
        let promise = $.ajax({
            type: "GET",
            url: url,
            contentType: 'application/json; charset=utf8',
            data: queryData
        });

        promise.done(function (data) {
            // feed the cache and compute expire timestamp. validity of null means it never expires.
            let now = Date.now();
            let expire = data.validity !== null ? data.validity * 1000 + now : null;
            if (!data.cacheable) {
                expire = now;
            }

            for (let key in data.items) {
                cache[key] = {
                    expire: expire,
                    value: data.items[key]
                };
            }

            session.logger.debug("Cache miss for entity " + options.format.model + ".");
        }).fail(function () {
            session.logger.debug("Cache failure for entity " + options.format.model + ".");
        });

        return promise;
    } else {
        return null;
    }
};

EntityCacheFetcher.prototype.get = function(cacheManager, options) {
    return cacheManager.get('entity', options.format.model);
};

module.exports = EntityCacheFetcher;
