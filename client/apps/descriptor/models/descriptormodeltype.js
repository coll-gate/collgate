/**
 * @file descriptormodeltype.js
 * @brief Type of model of descriptor model
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-10-13
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Backbone = require('backbone');

var Model = Backbone.Model.extend({
    url: function() {
        if (this.isNew()) {
            return application.baseUrl + 'descriptor/model/' + this.getModelId() + '/type/';
        }
        else
            return application.baseUrl + 'descriptor/model/' + this.getModelId() + '/type/' + this.get('id') + '/';
    },

    defaults: {
        id: null,
        name: '',
        model: null,
        label: '',
        position: 0,
        descriptor_type_group: 0,
        descriptor_type: 0,
        descriptor_type_name: '',
        descriptor_type_code: '',
        mandatory: false,
        set_once: false,
        index: 'None'
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
        var errors = {};
        var hasError = false;

        if (hasError) {
          return errors;
        }
    },

    getModelId: function() {
        if (typeof this.model_id != 'undefined') {
            return this.model_id;
        } else if (this.get('model') != null) {
            return this.model;
        } else if (typeof this.collection != 'undefined') {
            return this.collection.model_id;
        }
    }
});

module.exports = Model;

