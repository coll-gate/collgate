/**
 * @file accession.js
 * @brief Accession model
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-12-07
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let Backbone = require('backbone');

let Model = Backbone.Model.extend({
    url: function() {
        if (this.isNew())
            return window.application.url(['accession', 'accession']);
        else
            return window.application.url(['accession', 'accession', this.get('id')]);
    },

    defaults: {
        id: null,
        code: '',
        name: '',
        primary_classification_entry: undefined,
        descriptor_meta_model: undefined,
        descriptors: {},
        synonyms: []
    },

    parse: function(data) {
        return data;
    },

    validate: function(attrs) {
        let errors = {};
        let hasError = false;
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
