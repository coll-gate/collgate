/**
 * @file countable.js
 * @brief Entity collection with count support
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-08-31
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Collection = Backbone.Collection.extend({

    cache: {
        category: 'main',
        key: undefined
    },

    initialize: function (model, options) {
        options || (options = {cacheable: false});

        this.filters = (options.filters || []);
        this.search = (options.search || []);

        if (options.cacheable) {
            window.application.main.cache.registerCollection(this);
        }
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
        let data = (options.data || {});

        let opts = _.clone(options);
        opts.data = data;

        this.cursor = data.cursor;
        this.sort_by = data.sort_by;

        if (this.search && this.search.length) {
            opts.data.search = JSON.stringify(this.search)
        }

        if (this.filters && this.filters.length) {
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
        let data = (options.data || {});

        let opts = _.clone(options);
        opts.data = data;

        if (this.search && this.search.length) {
            opts.data.search = JSON.stringify(this.search)
        }

        if (this.filters && this.filters.length) {
            opts.data.filters = JSON.stringify(this.filters)
        }

        $.ajax({
            type: "GET",
            url: (_.isFunction(this.url) ? this.url() : this.url) + 'count/',
            dataType: 'json',
            data: opts.data,
            collection: this
        }).done(function (data) {
            this.collection.trigger('count', data.count);
        });
    }
});

module.exports = Collection;
