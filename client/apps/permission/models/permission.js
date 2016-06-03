/**
 * @file permission.js
 * @brief Permission model
 * @author Frederic SCHERMA
 * @date 2016-05-26
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Backbone = require('backbone');

var Permission = Backbone.Model.extend({
    //url: function() { return ohgr.baseUrl + 'permission/user/' + this.username + '/' + this.permission + '/'; },

    defaults: {
        model: undefined,
        object: undefined,
        permissions: []  // { id: '', name: '', app_label: ''}
    },

    init: function(options) {
        options || (options = {});
        this.username = options.username;
    },

    parse: function(data) {
        return data;
    },

    validate: function(attrs) {
        var errors = {};
        var hasError = false;

        if (hasError) {
          return errors;
        }
    },

    hasPerm: function (app_label, perm) {
        for (var i = 0; i < this.permissions.length; ++i) {
            if (app_label == this.permissions[i].app_label) {
                if (perm == this.permissions[i].id) {
                    return True;
                }
            }
        }
        return False;
    }
});

module.exports = Permission;
