/**
 * @file panel.js
 * @brief
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2017-09-12
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var Backbone = require('backbone');

var Model = Backbone.Model.extend({
    url: function () {
        if (this.isNew())
            return application.baseUrl + 'accession/accessions_panel/';
        else
            return application.baseUrl + 'accession/accessions_panel/' + this.get('id') + '/';
    },

    defaults: {
        id: null,
        name: '',
        selection: {},
        descriptor_meta_model: null,
        descriptors: {}
    },

    parse: function (data) {
        return data;
    },

    validate: function (attrs) {
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
