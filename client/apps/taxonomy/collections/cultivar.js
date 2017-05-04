/**
 * @file cultivar.js
 * @brief Cultivar collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-05-04
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var TaxonCollection = require('./taxon');

var Collection = TaxonCollection.extend({
    url: application.baseUrl + 'taxonomy/taxon/',

    initialize: function(models, options) {
        TaxonCollection.__super__.initialize.apply(this, arguments);

        this.filters = {
            rank: 90  // cultivar rank
        }
    },

    fetch: function(options) {
        options || (options = {});
        var data = (options.data || {});

        options.data = data;

        this.cursor = options.data.cursor;
        this.sort_by = options.data.sort_by;

        if (this.filters) {
            options.data.filters = JSON.stringify(this.filters)
        }

        return Backbone.Collection.prototype.fetch.call(this, options);
    }
});

module.exports = Collection;
