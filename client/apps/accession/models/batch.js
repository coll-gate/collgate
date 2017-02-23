/**
 * @file batch.js
 * @brief Batch model
 * @author Frederic SCHERMA
 * @date 2017-02-14
 * @copyright Copyright (c) 2017 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Backbone = require('backbone');

var Model = Backbone.Model.extend({
    url: function() {
        if (this.isNew())
            return application.baseUrl + 'accession/batch/';
        else
            return application.baseUrl + 'accession/batch/' + this.get('id') + '/';
    },

    defaults: {
        id: null,
        name: '',
        accession: undefined,
        descriptor_meta_model: undefined,
        descriptors: {}
    },

    parse: function(data) {
        return data;
    },

    validate: function(attrs) {
        var errors = {};
        var hasError = false;
        if (!attrs.name) {
            errors.name = 'Name must be valid and at least 3 characters length';
            hasError = true;
        }

        if (hasError) {
          return errors;
        }
    },
});

module.exports = Model;