/**
 * @file batchpanel.js
 * @brief
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2017-11-03
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Backbone = require('backbone');

let Model = Backbone.Model.extend({
    url: function () {
        if (this.isNew())
            return window.application.url(['accession', 'batchpanel']);
        else
            return window.application.url(['accession', 'batchpanel', this.get('id')]);
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
