/**
 * @file groupuser.js
 * @brief User model from a group
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-06-09
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Backbone = require('backbone');

var Model = Backbone.Model.extend({
    url: function() {
        if (this.isNew())
            return application.baseUrl + 'permission/group/' + this.collection.group_id + '/user/';
        else
            return application.baseUrl + 'permission/group/' + this.collection.group_id + '/user/' + this.get('username') + '/';
    },

    defaults: {
        id: null,
        username: '',
        first_name: '',
        last_name: '',
        email: '',
    },

    initialize: function(attributes, options) {
        options || (options = {});
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
});

module.exports = Model;

