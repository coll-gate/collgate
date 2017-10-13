/**
 * @file cachefetcher.js
 * @brief Base class fetcher for the cache manager to be specialized.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-07-07
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let CacheFetcher = function() {
    this.type = "";
};

CacheFetcher.prototype = {
    /**
     * Fetch values.
     * @param cacheManager Cache manager instance.
     * @param options Cache query options.
     * @param keys List of keys to fetch.
     * @param promise or null.
     */
    fetch: function(cacheManager, options, keys) {
        return null;
    },

    get: function(cacheManager, options) {
        return null;
    }
};

module.exports = CacheFetcher;
