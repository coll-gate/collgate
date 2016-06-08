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
            return ohgr.baseUrl + 'permission/group/' + this.name + '/permission/';
        else
            return ohgr.baseUrl + 'permission/user/' + this.name + '/permission/';
    },

    model: PermissionModel,

    initialize: function(models, options) {
        this.is_group = options.is_group || false;
        this.name = options.name;
    },

    parse: function(data) {
        if (data.result != 'success')
            return [];

        this.perms = data.perms;
        return data.permissions;
    },
});

module.exports = PermissionCollection;
