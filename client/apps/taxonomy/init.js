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

var TaxonomyModule = {

    name: "taxonomy",

    initialize: function(app, options) {
        Logger.time("Init taxonomy module");

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
                console.warning("No translation found for the current language. Fallback to english language");
            }
        }

        var SelectOptionItemView = require('../main/views/selectoptionitemview');

        var TaxonRankCollection = require('./collections/taxonrank');
        this.collections.taxonRanks = new TaxonRankCollection();

        this.views.taxonRanks = new SelectOptionItemView({
            className: "taxon-rank",
            collection: this.collections.taxonRanks,
            /*collection: new Backbone.Collection([
                {id: 60, value: gt.gettext("Family")},
                {id: 61, value: gt.gettext("Sub-family")},
                {id: 70, value: gt.gettext("Genus")},
                {id: 71, value: gt.gettext("Sub-genus")},
                {id: 80, value: gt.gettext("Specie")},
                {id: 81, value: gt.gettext("Sub-specie")}
            ]);*/
        });

        var TaxonSynonymTypeCollection = require('./collections/taxonsynonymtype');
        this.collections.taxonSynonymTypes = new TaxonSynonymTypeCollection();

        this.views.taxonSynonymTypes = new SelectOptionItemView({
            className: 'taxon-synonym-type',
            collection: this.collections.taxonSynonymTypes,
        });
        
        var TaxonController = require('./controllers/taxon');
        this.controllers.taxon = new TaxonController();

        Logger.timeEnd("Init taxonomy module");
    },

    start: function(options) {
        Logger.time("Start taxonomy module");

        var TaxonRouter = require('./routers/taxon');
        this.routers.taxon = new TaxonRouter();

        var TaxonCollection = require('./collections/taxon');
        this.collections.taxons = new TaxonCollection();

        Logger.timeEnd("Start taxonomy module");
    },

    stop: function(options) {

    }
};

module.exports = TaxonomyModule;
