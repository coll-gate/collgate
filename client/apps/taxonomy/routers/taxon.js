/**
 * @file taxon.js
 * @brief Taxon router
 * @author Frederic SCHERMA
 * @date 2016-04-13
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var TaxonModel = require('../models/taxon');
var TaxonCollection = require('../collections/taxon');
var TaxonListView = require('../views/taxonlist');
var TaxonItemView = require('../views/taxon');
var DefaultLayout = require('../../main/views/defaultlayout');
var TitleView = require('../../main/views/titleview');

var TaxonRouter = Marionette.AppRouter.extend({
    routes : {
        "app/taxonomy/": "getTaxonList",
        "app/taxonomy/create/": "getTaxonCreate",
        "app/taxonomy/:id/": "getTaxon",
    },

    getTaxonList : function() {
        var collection = ohgr.taxonomy.collections.taxons;
  /*      var taxonListView = new TaxonListView({
            edit: false,
            collection : ohgr.taxonomy.collections.taxons,
            // collection: new Backbone.Collection([
            //      {id: 1, name: 'Family1', rank: 60, synonyms: [{name: 'Family1', language_code:'en', type_code: 60}]},
            //      {id: 2, name: 'Genus1', rank: 70, synonyms: []}
            //  ]),
        });
*/
        var defaultLayout = new DefaultLayout({});
        ohgr.mainRegion.show(defaultLayout);

        defaultLayout.title.show(new TitleView({title: gettext("List of taxons")}));

        collection.fetch().then(function () {
            defaultLayout.content.show(new TaxonListView({edit: false, collection : collection}));
        });
    },

    getTaxon : function(id) {
        var taxon = new TaxonModel({id: id});

        var defaultLayout = new DefaultLayout();
        ohgr.mainRegion.show(defaultLayout);

        defaultLayout.title.show(new TitleView({title: gettext("Taxon details")}));

        taxon.fetch().then(function() {
            defaultLayout.content.show(new TaxonItemView({model: taxon}));
        });
    },
});

module.exports = TaxonRouter;
