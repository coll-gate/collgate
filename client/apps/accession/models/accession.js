/**
 * @file accession.js
 * @brief Accession model
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-12-07
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Backbone = require('backbone');

var Model = Backbone.Model.extend({
    url: function() {
        if (this.isNew())
            return application.baseUrl + 'accession/accession/';
        else
            return application.baseUrl + 'accession/accession/' + this.get('id') + '/';
    },

    defaults: {
        id: null,
        code: '',
        name: '',
        parent: undefined,
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

