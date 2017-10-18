/**
 * @file cachedcollection.js
 * @brief Collection with cache invalidation support
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-10-18
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Collection = Backbone.Collection.extend({
    cache: {
        category: 'main',
        key: undefined
    },

    initialize: function (options) {
        options || (options = {});

        window.application.main.cache.registerCollection(this);
    },

    parse: function(data) {
        return data;
    }
});

module.exports = Collection;
