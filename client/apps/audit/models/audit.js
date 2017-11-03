/**
 * @file audit.js
 * @brief Audit model
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-06-24
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let Backbone = require('backbone');

let Model = Backbone.Model.extend({
    defaults: {
        id: undefined,
        type: 0,
        user_id: undefined,
        username: '',
        app_label: '',
        model: undefined,
        object_id: undefined,
        object_name: '',
        fields: {}
    },

    init: function(attributes, options) {
        options || (options = {});
    },

    parse: function(data) {
        this.perms = data.perms;
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

