/**
 * @file panel.js
 * @brief
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2017-09-12
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var PanelModel = require('../models/panel');

var Collection = Backbone.Collection.extend({
    url: application.baseUrl + 'accession/panel/',
    model: PanelModel,

    initialize: function (options) {
        options || (options = {});
        this.filters = (options.filters || {});
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

        this.cursor = data.cursor;
        this.sort_by = data.sort_by;

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

    count: function(options) {
        options || (options = {});
        var data = (options.data || {});

        var opts = _.clone(options);
        opts.data = data;

        if (this.filters) {
            opts.data.filters = JSON.stringify(this.filters)
        }

        $.ajax({
            type: "GET",
            url: this.url + 'count/',
            dataType: 'json',
            data: opts.data,
            collection: this
        }).done(function (data) {
            this.collection.trigger('count', data.count);
        });
    }
});

module.exports = Collection;