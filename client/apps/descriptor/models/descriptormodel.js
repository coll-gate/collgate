/**
 * @file descriptormodel.js
 * @brief Model of descriptor
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-09-19
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Backbone = require('backbone');

var Model = Backbone.Model.extend({
    url: function() {
        if (this.isNew())
            return window.application.url(['descriptor', 'model']);
        else
            return window.application.url(['descriptor', 'model', this.get('id')]);
    },

    defaults: {
        id: null,
        name: '',
        verbose_name: '',
        description: '',
        num_descriptor_model_types: 0,
    },

    parse: function(data) {
        //this.perms = data.perms;
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
