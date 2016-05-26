/**
 * @file taxonrank.js
 * @brief Taxon rank collection
 * @author Frederic SCHERMA
 * @date 2016-04-13
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var TaxonRankModel = require('../models/taxonrank');

var TaxonRankCollection = Backbone.Collection.extend({
    url: ohgr.baseUrl + 'taxonomy/rank/',
    model: TaxonRankModel,

    parse: function(data) {
        return data;
    },

    findValue: function(id) {
        for (var r in this.models) {
            var rank = this.models[r];
            if (rank.get('id') == id)
                return rank.get('value');
        }
    },
});

module.exports = TaxonRankCollection;
