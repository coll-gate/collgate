/**
 * @file accessionsynonymtype.js
 * @brief Accession synonym type collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-01-16
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var AccessionSynonymTypeModel = require('../models/accessionsynonymtype');

var Collection = Backbone.Collection.extend({
    url: application.baseUrl + 'accession/accession-synonym-type/',
    model: AccessionSynonymTypeModel,

    findValue: function(id) {
        for (var r in this.models) {
            var m = this.models[r];
            if (m.get('id') === id)
                return m.get('value');
        }
    },

    findLabel: function(value) {
        for (var r in this.models) {
            var m = this.models[r];
            if (m.get('value') === value)
                return m.get('label');
        }
    }
});

module.exports = Collection;

