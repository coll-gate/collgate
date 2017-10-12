/**
 * @file descriptorpanel.js
 * @brief Model of panel of descriptor
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-10-27
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Backbone = require('backbone');

var Model = Backbone.Model.extend({
    url: function() {
        var model_id = this.model_id || this.get('model') || this.collection.model_id;

        if (this.isNew()) {
            return window.application.url(['descriptor', 'meta-model', model_id, 'panel']);
        } else {
            return window.application.url(['descriptor', 'meta-model', model_id, 'panel', this.get('id')]);
        }
    },

    defaults: {
        id: null,
        label: '',
        descriptor_model: null,
        descriptor_model_name: '',
        descriptor_model_verbose_name: '',
    },

    initialize: function(attributes, options) {
        Model.__super__.initialize.apply(this, arguments);

        options || (options = {});

        if (options.collection) {
            this.model_id = options.collection.model_id;
        }
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
    }
});

module.exports = Model;
