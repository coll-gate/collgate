/**
 * @file descriptorvalue.js
 * @brief List of value for a type of descriptor (collection)
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-07-21
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let DescriptorTypeModel = require('../models/descriptorvalue');

let Collection = Backbone.Collection.extend({
    url: function() {
        return window.application.url(['descriptor', 'descriptor', this.type_id, 'value']);
    },

    model: DescriptorTypeModel,

    initialize: function(models, options) {
        options || (options = {});

        this.sort_by = "id";
        this.group_id = options.group_id;
        this.type_id = options.type_id;
        this.format = options.format || {type: "string", fields: []};
    },

    parse: function(data) {
        if (data.format) {
            this.format = data.format;
        }

        this.prev = data.prev;
        this.cursor = data.cursor;
        this.next = data.next;
        this.sort_by = data.sort_by;

        return data.items;
    },

    fetch: function(options) {
        options || (options = {});
        let data = (options.data || {});

        let opts = _.clone(options);
        opts.data = data;

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
