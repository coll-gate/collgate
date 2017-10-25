/**
 * @file permission.js
 * @brief Permission collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-05-26
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let PermissionModel = require('../models/permission');

let PermissionCollection = Backbone.Collection.extend({
    url: function() {
        if (this.is_group)
            return window.application.url(['permission', 'group', this.group_id, 'permission']);
        else
            return window.application.url(['permission', 'user', this.username, 'permission']);
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
