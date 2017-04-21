/**
 * @file user.js
 * @brief Permission user collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-05-30
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var PermissionUserModel = require('../models/user');

var Collection = Backbone.Collection.extend({
    url: function() {
        if (this.is_group)
            return application.baseUrl + 'permission/group/' + this.name + '/user/';
        else
            return application.baseUrl + 'permission/user/';
    },

    model: PermissionUserModel,

    initialize: function(models, options) {
        options || (options = {});
        this.is_group = options.is_group || false;

        if (options.name)
            this.name = options.name;
    },

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

