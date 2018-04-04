/**
 * @file storagelocation.js
 * @brief Storage location model
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2018-04-04
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Backbone = require('backbone');

let Model = Backbone.Model.extend({
    url: function () {
        if (this.isNew())
            return window.application.url(['accession', 'storagelocation']);
        else
            return window.application.url(['accession', 'storagelocation', this.get('id')]);
    },

    defaults: {
        id: null,
        name: '',
        label: ''
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
