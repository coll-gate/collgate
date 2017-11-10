/**
 * @file columncachefetcher.js
 * @brief Cache fetcher specialized for entity columns description.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-10-02
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let CacheFetcher = require('../../main/utils/cachefetcher');

let ColumnCacheFetcher = function() {
    CacheFetcher.call(this);

    this.type = "entity_columns";
};

ColumnCacheFetcher.prototype = Object.create(CacheFetcher.prototype);
ColumnCacheFetcher.prototype.constructor = ColumnCacheFetcher;

/**
 * Fetch values.
 * @param keys Keys list.
 */
ColumnCacheFetcher.prototype.fetch = function(cacheManager, options, keys) {
    let name = options.format.model;
    let queryData = {};
    if (options.format.descriptor_meta_models && options.format.descriptor_meta_models.length > 0) {
        name += ':' + options.format.descriptor_meta_models.sort().toString();
        queryData.descriptor_meta_models = options.format.descriptor_meta_models.toString();
    }

    if (options.format.mode === 'search') {
        name += ':' + options.format.mode;
        queryData.mode = options.format.mode;
    }

    let cache = cacheManager.get('entity_columns', name);

    let doFetch = false;
    let now = Date.now();

    // lookup into the global cache
    let entry = 0 in cache ? cache[0] : undefined;

    if (cacheManager.enabled && entry !== undefined) {
        // found. look for validity
        if (entry.expire !== null && entry.expire <= now) {
            doFetch = true;
        }
    } else {
        doFetch = true;
    }

    let url = window.application.url(['descriptor', 'columns', options.format.model]);

    if (doFetch) {
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

            cache[0] = {
                expire: expire,
                value: data.columns
            };

            session.logger.debug("Cache miss for columns description " + options.format.model + ".");
        }).fail(function () {
            session.logger.debug("Cache failure for columns description " + options.format.model + ".");
        });

        return promise;
    } else {
        return null;
    }
};

ColumnCacheFetcher.prototype.get = function(cacheManager, options) {
    let name = options.format.model;
    if (options.format.descriptor_meta_models && options.format.descriptor_meta_models.length > 0) {
        name += ':' + options.format.descriptor_meta_models.sort().toString();
    }
    if (options.format.mode === 'search') {
        name += ':' + options.format.mode;
    }

    return cacheManager.get('entity_columns', name);
};

module.exports = ColumnCacheFetcher;
