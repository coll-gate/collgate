/**
 * @file descriptormetamodel.js
 * @brief Meta-model of descriptor
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-10-27
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let Backbone = require('backbone');

let Model = Backbone.Model.extend({
    url: function() {
        if (this.isNew())
            return window.application.url(['descriptor', 'meta-model']);
        else
            return window.application.url(['descriptor', 'meta-model', this.get('id')]);
    },

    defaults: {
        id: null,
        name: '',
        label: '',
        description: '',
        target: '',
        parameters: {},
        num_descriptor_models: 0,
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

