/**
 * @file descriptorpanel.js
 * @brief Model of panel of descriptor
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-10-27
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let Backbone = require('backbone');

let Model = Backbone.Model.extend({
    url: function() {
        let model_id = this.model_id || this.get('model') || this.collection.model_id;

        if (this.isNew()) {
            return window.application.url(['descriptor', 'layout', model_id, 'panel']);
        } else {
            return window.application.url(['descriptor', 'layout', model_id, 'panel', this.get('position')]);
        }
    },

    defaults: {
        id: null,
        position: null,
        label: '',
        layout: this.model_id,
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
        let errors = {};
        let hasError = false;

        if (hasError) {
          return errors;
        }
    }
});

module.exports = Model;
