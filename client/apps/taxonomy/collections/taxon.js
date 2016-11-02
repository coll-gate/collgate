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
    url: application.baseUrl + 'taxonomy/',
    model: TaxonModel,

    parse: function(data) {
        this.prev = data.prev;
        this.page = data.page;
        this.next = data.next;

        return data.items;
    },
});

module.exports = TaxonCollection;
