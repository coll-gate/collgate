/**
 * @file descriptorgroup.js
 * @brief Group of descriptors model
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-07-20
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let Backbone = require('backbone');

let Model = Backbone.Model.extend({
    url: function() {
        if (this.isNew())
            return window.application.url(['descriptor', 'group']);
        else
            return window.application.url(['descriptor', 'group', this.get('id')]);
    },

    defaults: {
        id: null,
        name: '',
        num_descriptor_types: 0,
        can_delete: false,
        can_modify: false
    },

    parse: function(data) {
        //this.perms = data.perms;
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

