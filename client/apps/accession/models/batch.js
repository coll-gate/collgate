/**
 * @file batch.js
 * @brief Batch model
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-02-14
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Backbone = require('backbone');

var Model = Backbone.Model.extend({
    url: function() {
        if (this.isNew())
            return window.application.url(['accession', 'batch']);
        else
            return window.application.url(['accession', 'batch', this.get('id')]);
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
    }
});

module.exports = Model;
