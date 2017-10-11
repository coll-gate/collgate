/**
 * @file columncachefetcher.js
 * @brief Cache fetcher specialized for entity columns description.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-10-02
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var CacheFetcher = require('../../main/utils/cachefetcher');

var ColumnCacheFetcher = function() {
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
    var name = options.format.model;
    if (options.format.descriptor_meta_models && options.format.descriptor_meta_models.length > 0) {
        name += ':' + options.format.descriptor_meta_models.sort().toString();
    }

    var cache = cacheManager.get('entity_columns', name);

    var queryData = {};
    var doFetch = false;
    var now = Date.now();

    // lookup into the global cache
    var entry = 0 in cache ? cache[0] : undefined;

    if (cacheManager.enabled && entry !== undefined) {
        // found. look for validity
        if (entry.expire !== null && entry.expire <= now) {
            doFetch = true;
        }
    } else {
        doFetch = true;
    }

    var url = 'descriptor/columns/' + options.format.model + '/';

    if (options.format.descriptor_meta_models && options.format.descriptor_meta_models.length > 0) {
        queryData.descriptor_meta_models = options.format.descriptor_meta_models.toString();
    }

    if (doFetch) {
        var promise = $.ajax({
            type: "GET",
            url: application.baseUrl + url,
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
    var name = options.format.model;
    if (options.format.descriptor_meta_models && options.format.descriptor_meta_models.length > 0) {
        name += ':' + options.format.descriptor_meta_models.sort().toString();
    }

    return cacheManager.get('entity_columns', name);
};

module.exports = ColumnCacheFetcher;
