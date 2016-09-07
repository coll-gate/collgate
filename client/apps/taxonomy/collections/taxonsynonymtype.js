/**
 * @file taxonsynonymtype.js
 * @brief Taxon synonym type collection
 * @author Frederic SCHERMA
 * @date 2016-04-12
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var TaxonSynonymTypeModel = require('../models/taxonsynonymtype');

var Collection = Backbone.Collection.extend({
    url: application.baseUrl + 'taxonomy/taxon-synonym-type/',
    model: TaxonSynonymTypeModel,

    findValue: function(id) {
        for (var r in this.models) {
            var m = this.models[r];
            if (m.get('id') == id)
                return m.get('value');
        }
    },

    findLabel: function(value) {
        for (var r in this.models) {
            var m = this.models[r];
            if (m.get('value') == value)
                return m.get('label');
        }
    }
});

module.exports = Collection;
