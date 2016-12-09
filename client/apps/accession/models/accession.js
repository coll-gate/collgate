/**
 * @file accession.js
 * @brief Accession model
 * @author Frederic SCHERMA
 * @date 2016-12-07
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Backbone = require('backbone');

var Model = Backbone.Model.extend({
    url: function() {
        if (this.isNew())
            return application.baseUrl + 'accession/accession/create/' + this.get('meta_model') + '/';
        else
            return application.baseUrl + 'accession/accession/' + this.get('id') + '/';
    },

    defaults: {
        id: null,
        name: '',
        parent: undefined,
        meta_model: undefined,
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
