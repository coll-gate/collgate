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
var TaxonDetailsView = require('../views/taxondetails');

var DefaultLayout = require('../../main/views/defaultlayout');
var TitleView = require('../../main/views/titleview');
var ScrollingMoreView = require('../../main/views/scrollingmore');

var TaxonRouter = Marionette.AppRouter.extend({
    routes : {
        "app/taxonomy/": "getTaxonList",
        "app/taxonomy/:id/": "getTaxon",
    },

    getTaxonList : function() {
        var collection = application.taxonomy.collections.taxons;

        var defaultLayout = new DefaultLayout({});
        application.getRegion('mainRegion').show(defaultLayout);

        defaultLayout.getRegion('title').show(new TitleView({title: gt.gettext("List of taxons")}));

        collection.fetch().then(function () {
            var taxonListView = new TaxonListView({read_only: true, collection : collection});

            defaultLayout.getRegion('content').show(taxonListView);
            defaultLayout.getRegion('content_bottom').show(new ScrollingMoreView({targetView: taxonListView}));
        });
    },

    getTaxon : function(id) {
        var taxon = new TaxonModel({id: id});

        var defaultLayout = new DefaultLayout();
        application.getRegion('mainRegion').show(defaultLayout);

        defaultLayout.getRegion('title').show(new TitleView({title: gt.gettext("Taxon details")}));

        taxon.fetch().then(function() {
            defaultLayout.getRegion('content').show(new TaxonDetailsView({model: taxon}));
        });
    },
});

module.exports = TaxonRouter;
