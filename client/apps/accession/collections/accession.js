/**
 * @file accession.js
 * @brief Accession collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-12-09
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var AccessionModel = require('../models/accession');

var Collection = Backbone.Collection.extend({
    url: application.baseUrl + 'accession/accession/',
    model: AccessionModel,

    // comparator: 'name',

    parse: function(data) {
        this.prev = data.prev;
        this.cursor = data.cursor;
        this.next = data.next;
        this.perms = data.perms;

        return data.items;
    },

    fetch: function(options) {
        options || (options = {});
        var data = (options.data || {});

        var opts = _.clone(options);
        opts.data = data;

        this.cursor = data.cursor;
        this.sort_by = data.sort_by;

        if (this.filters) {
            opts.data.filters = JSON.stringify(this.filters)
        }

        if (data.cursor && typeof data.cursor !== 'string') {
            opts.data.cursor = JSON.stringify(data.cursor);
        }

        return Backbone.Collection.prototype.fetch.call(this, opts);
    }
});

module.exports = Collection;
