/**
 * @file group.js
 * @brief Group model
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-05-30
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Backbone = require('backbone');

var Model = Backbone.Model.extend({
    url: function() {
        if (this.isNew())
            return window.application.url(['permission', 'group']);
        else
            return window.application.url(['permission' ,'group', this.get('id')]);
    },

    defaults: {
        id: null,
        name: '',
        num_users: 0,
        num_permissions: 0,
    },

    initialize: function(attributes, options) {
        options || (options = {});
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

