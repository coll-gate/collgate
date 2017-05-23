/**
 * @file taxonrank.js
 * @brief Taxon rank collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-04-13
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var TaxonRankModel = require('../models/taxonrank');

var TaxonRankCollection = Backbone.Collection.extend({
    url: application.baseUrl + 'classification/rank/',
    model: TaxonRankModel,

    findValue: function(id) {
        for (var r in this.models) {
            var rank = this.models[r];
            if (rank.get('id') == id)
                return rank.get('value');
        }
    },

    findLabel: function(value) {
        for (var r in this.models) {
            var rank = this.models[r];
            if (rank.get('value') == value)
                return rank.get('label');
        }
    }
});

module.exports = TaxonRankCollection;

