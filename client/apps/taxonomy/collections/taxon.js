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
/*
    initialize: function(models, options) {
        options || (options = {});

    },*/
    
    parse: function(data) {
        // var taxons = data.taxons;
        // var results = [];
        // for (var taxon in taxons) {
        //     var elt = {};
        //
        //     elt = taxons[taxon].fields;
        //     elt.id = taxons[taxon].pk;
        //     elt.parent_list = elt.parent_list.split(',');
        //
        //     // distinct collection of synonyms
        //     if (typeof(elt.synonyms) == "undefined") {
        //         elt.synonyms = [];
        //
        //         for (var s in data.synonyms) {
        //             var synonym = data.synonyms[s].fields;
        //             if (synonym.taxon == elt.id) {
        //                 elt.synonyms.push({
        //                     name: synonym.name,
        //                     type: synonym.type,
        //                     language: synonym.language,
        //                 });
        //             }
        //         }
        //     }
        //
        //     results.push(elt);
        // }
        //
        // return results;

        this.page = data.page;
        this.total_count = data.total_count;
        
        return data.items;
    },
});

module.exports = TaxonCollection;
