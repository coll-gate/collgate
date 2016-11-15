/**
 * @file descriptorvalue.js
 * @brief List of value for a type of descriptor (collection)
 * @author Frederic SCHERMA
 * @date 2016-07-21
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var DescriptorTypeModel = require('../models/descriptorvalue');

var Collection = Backbone.Collection.extend({
    url: function() {
        return application.baseUrl + 'descriptor/group/' + this.group_id + '/type/' + this.type_id + '/value/';
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
        var data = (options.data || {});

        options.data = data;

        this.cursor = options.data.cursor;
        this.sort_by = options.data.sort_by;

        return Backbone.Collection.prototype.fetch.call(this, options);
    }
});

module.exports = Collection;
