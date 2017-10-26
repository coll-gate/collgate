/**
 * @file audit.js
 * @brief Audit collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-06-24
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let AuditModel = require('../models/audit');

let Collection = Backbone.Collection.extend({
    url: function() {
        return window.application.url(['audit' ,'search']);
    },
    model: AuditModel,

    initialize: function(models, options) {
        options || (options = {});

        this.filters = (options.filters || {});
        this.search = (options.search || {});

         if (typeof(options.username) !== "undefined") {
             this.username = options.username;
        } else if (typeof(options.entity) !== "undefined") {
             this.entity = options.entity; /*{
                 app_label: options.app_label,
                 model: options.model,
                 object_id: options.object_id
            }*/
        }
    },

    parse: function(data) {
        this.prev = data.prev;
        this.cursor = data.cursor;
        this.next = data.next;
        this.perms = data.perms;

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

        if (typeof(this.username) !== "undefined") {
            data.username = this.username;
        } else if (typeof(this.entity) !== "undefined") {
            data.app_label = this.entity.app_label;
            data.model = this.entity.model;
            data.object_id = this.entity.object_id;
        }

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
    }
});

module.exports = Collection;
