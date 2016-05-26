/**
 * @file taxon.js
 * @brief Taxon collection
 * @author Frederic SCHERMA
 * @date 2016-04-13
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var TaxonModel = require('../models/taxon');

var TaxonCollection = Backbone.Collection.extend({
    url: ohgr.baseUrl + 'taxonomy/',
    model: TaxonModel,
    
    parse: function(data) {
        if (data.result != 'success')
            return {};

        var taxons = data.taxons;
        var results = [];
        for (var taxon in taxons) {
            var elt = {};

            elt = taxons[taxon].fields;
            elt.id = taxons[taxon].pk;
            elt.parent_list = elt.parent_list.split(',');
            elt.synonyms = [];

            for (var s in data.synonyms) {
                var synonym = data.synonyms[s].fields;
                if (synonym.taxon == elt.id) {
                    elt.synonyms.push({
                        name: synonym.name,
                        type: synonym.type,
                        language: synonym.language,
                    });
                }
            }

            results.push(elt);
        }

        return results;
    },
});

module.exports = TaxonCollection;
