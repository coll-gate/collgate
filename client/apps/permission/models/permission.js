/**
 * @file permission.js
 * @brief Permission model
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-05-26
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let Backbone = require('backbone');

let Permission = Backbone.Model.extend({
    defaults: {
        model: undefined,
        object: undefined,
        permissions: []  // { id: '', name: '', app_label: ''}
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

    hasPerm: function (app_label, perm) {
        for (let i = 0; i < this.permissions.length; ++i) {
            if (app_label == this.permissions[i].app_label) {
                if (perm == this.permissions[i].id) {
                    return true;
                }
            }
        }
        return false;
    }
});

module.exports = Permission;

