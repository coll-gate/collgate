/**
 * @file groupuser.js
 * @brief User model from a group
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-06-09
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let Backbone = require('backbone');

let Model = Backbone.Model.extend({
    url: function() {
        if (this.isNew()) {
            return window.application.url(['permission', 'group', this.collection.group_id, 'user']);
        } else {
            return window.application.url(['permission', 'group', this.collection.group_id, 'user', 'username', this.get('username')]);
        }
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
        let errors = {};
        let hasError = false;

        if (hasError) {
          return errors;
        }
    },
});

module.exports = Model;
