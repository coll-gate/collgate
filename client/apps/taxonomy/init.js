/**
 * @file init.js
 * @brief Taxonomy module init entry point
 * @author Frederic SCHERMA
 * @date 2016-04-12
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var TaxonomyModule = Marionette.Module.extend({

    initialize: function(moduleName, app, options) {
        this.models = {};
        this.collections = {};
        this.views = {};
        this.routers = {};
        this.controllers = {};

        var SelectOptionItemView = require('../main/views/selectoptionitemview');

        var TaxonRankCollection = require('./collections/taxonrank');
        this.collections.taxonRanks = new TaxonRankCollection();

        this.views.taxonRanks = new SelectOptionItemView({
            className: "taxon-rank",
            collection: this.collections.taxonRanks,
        });

        var TaxonController = require('./controllers/taxon');
        this.controllers.Taxon = new TaxonController();
    },

    onStart: function(options) {
        var TaxonRouter = require('./routers/taxon');
        this.routers.taxon = new TaxonRouter();

        var TaxonCollection = require('./collections/taxon');
        this.collections.taxons = new TaxonCollection();
    },

    onStop: function(options) {

    },
});

// taxonomy module
var taxonomy = ohgr.module("taxonomy", TaxonomyModule);

module.exports = taxonomy;
