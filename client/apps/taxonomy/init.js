/**
 * @file init.js
 * @brief Taxonomy module init entry point
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-04-12
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Marionette = require('backbone.marionette');

var TaxonomyModule = function() {
    this.name = "taxonomy";
};

TaxonomyModule.prototype = {
    initialize: function(app, options) {
        this.models = {};
        this.collections = {};
        this.views = {};
        this.routers = {};
        this.controllers = {};

        // i18n if not english
        if (session.language !== "en") {
            try {
                i18next.addResources(session.language, 'default', require('./locale/' + session.language + '/LC_MESSAGES/default.json'));
            } catch (e) {
                console.warn("No translation found for the current language. Fallback to english language");
            }
        }

        //
        // main collections
        //

        var SelectOption = require('../main/renderers/selectoption');

        var TaxonRankCollection = require('./collections/taxonrank');
        this.collections.taxonRanks = new TaxonRankCollection();

        this.views.taxonRanks = new SelectOption({
            className: "taxon-rank",
            collection: this.collections.taxonRanks
        });

        var TaxonSynonymTypeCollection = require('./collections/taxonsynonymtype');
        this.collections.taxonSynonymTypes = new TaxonSynonymTypeCollection();

        this.views.taxonSynonymTypes = new SelectOption({
            className: 'taxon-synonym-type',
            collection: this.collections.taxonSynonymTypes
        });

        //
        // controllers
        //

        var TaxonController = require('./controllers/taxon');
        this.controllers.taxon = new TaxonController();

        //
        // routers
        //

        var TaxonRouter = require('./routers/taxon');
        this.routers.taxon = new TaxonRouter();

        var TaxonCollection = require('./collections/taxon');
        this.collections.taxons = new TaxonCollection();
    },

    start: function(options) {
        // nothing to do
    },

    stop: function(options) {

    }
};

module.exports = TaxonomyModule;

