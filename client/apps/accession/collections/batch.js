/**
 * @file batch.js
 * @brief Batch collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-02-14
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var BatchModel = require('../models/batch');

var Collection = Backbone.Collection.extend({
    url: function() {
        if (this.panel_id) {
            return window.application.url(['accession', 'batches_panel', this.panel_id, '/batches']);
        } else if (this.accession_id) {
            return window.application.url(['accession', 'accession', this.accession_id, 'batch']);
        } else if (this.batch_id) {
            if (this.batch_type === "parents") {
                return window.application.url(['accession', 'batch', this.batch_id, 'parent']);
            } else {
                return window.application.url(['accession', 'batch', this.batch_id, 'batch']);
            }
        } else {
            return window.application.url(['accession', 'batch']);
        }
    },
    model: BatchModel,

    // comparator: 'name',

    initialize: function(models, options) {
        options || (options = {});

        this.batch_type = options.batch_type || '';
        this.accession_id = options.accession_id;
        this.batch_id = options.batch_id;

        this.panel_id = (options.panel_id || null);
        this.filters = (options.filters || {});
        this.search = (options.search || {});
    },

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

        // options.data = data;

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
