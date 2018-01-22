/**
 * @file layoutdescriptor.js
 * @brief Model of layout descriptor
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-10-13
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let Backbone = require('backbone');

let Model = Backbone.Model.extend({
    url: function() {
        if (this.isNew()) {
            return window.application.url(['descriptor', 'layout', this.collection.model_id, 'panel', this.collection.panel_index, 'descriptor']);
        } else {
            return window.application.url(['descriptor', 'layout', this.collection.model_id, 'panel', this.collection.panel_index, 'descriptor', this.get('position')]);
        }
    },

    defaults: {
        id: null,
        name: '',
        label: '',
        position: null,
        mandatory: false,
        set_once: false
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
        this.model = data.model;
        return data;
    },

    validate: function(attrs) {
        let errors = {};
        let hasError = false;

        if (hasError) {
          return errors;
        }
    },

    // getModelId: function() {
    //     if (typeof this.model_id != 'undefined') {
    //         return this.model_id;
    //     } else if (this.get('model') != null) {
    //         return this.model;
    //     } else if (typeof this.collection != 'undefined') {
    //         return this.collection.model_id;
    //     }
    // }
});

module.exports = Model;

