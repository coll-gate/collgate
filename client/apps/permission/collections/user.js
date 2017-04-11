/**
 * @file user.js
 * @brief Permission user collection
 * @author Frederic SCHERMA
 * @date 2016-05-30
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
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
});

module.exports = Collection;
