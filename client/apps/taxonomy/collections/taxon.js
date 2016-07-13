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
        this.page = data.page;
        this.total_count = data.total_count;

        return data.items;
    },
});

module.exports = TaxonCollection;
