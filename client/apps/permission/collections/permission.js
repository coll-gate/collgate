/**
 * @file permission.js
 * @brief Permission collection
 * @author Frederic SCHERMA
 * @date 2016-05-26
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var PermissionModel = require('../models/permission');

var PermissionCollection = Backbone.Collection.extend({
    url: function() {
        if (this.is_group)
            return application.baseUrl + 'permission/group/' + this.group_id + '/permission/';
        else
            return application.baseUrl + 'permission/user/' + this.username + '/permission/';
    },

    model: PermissionModel,

    initialize: function(models, options) {
        this.is_group = options.is_group || false;
        this.username = options.username;
        this.group_id = options.group_id;
    },

    parse: function(data) {
        this.perms = data.perms;
        return data.permissions;
    },
});

module.exports = PermissionCollection;
