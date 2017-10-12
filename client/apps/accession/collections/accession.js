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
    model: AccessionModel,

    url: function() {
        if (this.panel_id) {
            return window.application.url(['accession', 'accessions_panel', this.panel_id, 'accessions']);
        } else {
            return window.application.url(['accession', 'accession']);
        }
    },

    initialize: function (models, options) {
        options || (options = {});

        this.panel_id = (options.panel_id || null);
        this.filters = (options.filters || {});
        this.search = (options.search || {});
    },

    parse: function (data) {
        this.prev = data.prev;
        this.cursor = data.cursor;
        this.next = data.next;
        this.perms = data.perms;

        return data.items;
    },

    fetch: function (options) {
        options || (options = {});
        var data = (options.data || {});

        var opts = _.clone(options);
        opts.data = data;

        this.cursor = data.cursor;
        this.sort_by = data.sort_by;

        if (this.search) {
            opts.data.search = JSON.stringify(this.search)
        }

        if (this.filters) {
            opts.data.filters = JSON.stringify(this.filters)
        }

        if (data.cursor && typeof data.cursor !== 'string') {
            opts.data.cursor = JSON.stringify(data.cursor);
        }

        if (data.sort_by && typeof data.sort_by !== 'string') {
            opts.data.sort_by = JSON.stringify(data.sort_by);
        }

        return Backbone.Collection.prototype.fetch.call(this, opts);
    },

    count: function (options) {
        options || (options = {});
        var data = (options.data || {});

        var opts = _.clone(options);
        opts.data = data;

        if (this.search) {
            opts.data.search = JSON.stringify(this.search)
        }

        if (this.filters) {
            opts.data.filters = JSON.stringify(this.filters)
        }

        $.ajax({
            type: "GET",
            url: this.url() + 'count/',
            dataType: 'json',
            data: opts.data,
            collection: this
        }).done(function (data) {
            this.collection.trigger('count', data.count);
        });
    }
});

module.exports = Collection;
