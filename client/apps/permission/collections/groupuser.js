/**
 * @file groupuser.js
 * @brief Permission user collection from a group
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-06-09
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var PermissionGroupUserModel = require('../models/groupuser');

var Collection = Backbone.Collection.extend({
    url: function() { return application.baseUrl + 'permission/group/' + this.group_id + '/user/'; },
    model: PermissionGroupUserModel,

    initialize: function(models, options) {
        options || (options = {});
        this.group_id = options.group_id;
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

