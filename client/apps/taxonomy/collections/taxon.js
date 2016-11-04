/**
 * @file taxon.js
 * @brief Taxon collection
 * @author Frederic SCHERMA
 * @date 2016-04-13
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var TaxonModel = require('../models/taxon');

var TaxonCollection = Backbone.Collection.extend({
    url: application.baseUrl + 'taxonomy/',
    model: TaxonModel,

    comparator: 'name',

    parse: function(data) {
        this.prev = data.prev;
        this.page = data.page;
        this.next = data.next;

        return data.items;
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

module.exports = TaxonCollection;
