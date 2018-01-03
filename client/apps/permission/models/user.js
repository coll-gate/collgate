/**
 * @file user.js
 * @brief User model
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-05-30
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let Backbone = require('backbone');

let Model = Backbone.Model.extend({
    url: function() {
        return window.application.url(['permission', 'user', 'username', this.get('username')]);
    },

    defaults: {
        id: undefined,
        username: '',
        first_name: '',
        last_name: '',
        email: '',
        is_active: false,
        is_staff: false,
        is_superuser: false
    },

    isNew : function () { return typeof(this.get('username')) !== 'string'; },

    initialize: function(attributes, options) {
        options || (options = {});

        // this.on('change:is_active', this.partialUpdate, this);
        // this.on('change:is_staff', this.partialUpdate, this);
        // this.on('change:is_superuser', this.partialUpdate, this);
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

    // partialUpdate: function () {
    //     // why not working ???
    //     console.log("user::partialUpdate");
    //     this.save(this.model.changedAttributes(), {patch: true});
    // },
});

module.exports = Model;
