/**
 * @file group.js
 * @brief Group model
 * @author Frederic SCHERMA
 * @date 2016-05-30
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Backbone = require('backbone');

var Model = Backbone.Model.extend({
    url: function() {
        if (this.isNew())
            return application.baseUrl + 'permission/group/';
        else
            return application.baseUrl + 'permission/group/' + this.get('name') + '/';
    },

    defaults: {
        id: undefined,
        name: undefined,
        num_users: 0,
        num_permissions: 0,
    },

    init: function(options) {
        options || (options = {});
        this.name = options.name;
    },

    parse: function(data) {
        this.perms = data.perms;
        return data;
    },

    validate: function(attrs) {
        var errors = {};
        var hasError = false;

        if (hasError) {
          return errors;
        }
    },
});

module.exports = Model;
