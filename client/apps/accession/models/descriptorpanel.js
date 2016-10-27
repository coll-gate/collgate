/**
 * @file descriptorpanel.js
 * @brief Model of panel of descriptor
 * @author Frederic SCHERMA
 * @date 2016-10-27
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Backbone = require('backbone');

var Model = Backbone.Model.extend({
    url: function() {
        var model_id = this.model_id || this.get('model') || this.collection.model_id;

        if (this.isNew()) {
            return application.baseUrl + 'accession/descriptor/meta-model/' + model_id + '/panel/';
        }
        else
            return application.baseUrl + 'accession/descriptor/meta-model/' + model_id + '/panel/' + this.get('id') + '/';
    },

    defaults: {
        id: null,
        name: '',
        label: '',
        model: null,
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
    },
});

module.exports = Model;
