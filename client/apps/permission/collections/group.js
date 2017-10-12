/**
 * @file group.js
 * @brief Permission group collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-05-30
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var PermissionGroupModel = require('../models/group');

var Collection = Backbone.Collection.extend({
    url: function() {
        return window.application.url(['permission', 'group']);
    },
    model: PermissionGroupModel,

    comparator: 'name',

    parse: function(data) {
        this.perms = data.perms;
        this.cursor = data.cursor;
        this.prev = data.prev;
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

module.exports = Collection;

