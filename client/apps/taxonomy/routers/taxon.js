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

var TaxonChildrenCollection = require('../collections/taxonchildren');
var TaxonEntitiesCollection = require('../collections/taxonentities');

var TaxonListView = require('../views/taxonlist');
var TaxonSynonymsView = require('../views/taxonsynonyms');
var TaxonDetailsView = require('../views/taxondetails');
var TaxonListFilterView = require('../views/taxonlistfilter');
var TaxonChildrenView = require('../views/taxonchildren');
var TaxonEntitiesView = require('../views/taxonentities');
var TaxonDescriptorView = require('../views/taxondescriptor');
var TaxonDescriptorCreateView = require('../views/taxondescriptorcreate');
var TaxonLayout = require('../views/taxonlayout');

var DefaultLayout = require('../../main/views/defaultlayout');
var TitleView = require('../../main/views/titleview');
var ScrollingMoreView = require('../../main/views/scrollingmore');

var TaxonRouter = Marionette.AppRouter.extend({
    routes : {
        "app/taxonomy/taxon/": "getTaxonList",
        "app/taxonomy/taxon/:id/": "getTaxon",
    },

    getTaxonList : function() {
        var collection = application.taxonomy.collections.taxons;

        var defaultLayout = new DefaultLayout({});
        application.getRegion('mainRegion').show(defaultLayout);

        defaultLayout.getRegion('title').show(new TitleView({title: gt.gettext("List of taxons")}));

        collection.fetch().then(function () {
            var taxonListView = new TaxonListView({collection : collection});

            defaultLayout.getRegion('content').show(taxonListView);
            defaultLayout.getRegion('content-bottom').show(new ScrollingMoreView({targetView: taxonListView}));
        });

        defaultLayout.getRegion('bottom').show(new TaxonListFilterView({collection: collection}));
    },

    getTaxon : function(id) {
        var taxon = new TaxonModel({id: id});

        var defaultLayout = new DefaultLayout();
        application.getRegion('mainRegion').show(defaultLayout);

        var taxonLayout = new TaxonLayout();
        defaultLayout.getRegion('content').show(taxonLayout);

        taxon.fetch().then(function() {
            defaultLayout.getRegion('title').show(new TitleView({title: gt.gettext("Taxon details"), model: taxon}));
            taxonLayout.getRegion('details').show(new TaxonDetailsView({model: taxon}));
            taxonLayout.getRegion('synonyms').show(new TaxonSynonymsView({model: taxon}));

            // get the layout before creating the view
            if (taxon.get('descriptor_meta_model') != null) {
                $.ajax({
                    method: "GET",
                    url: application.baseUrl + 'descriptor/meta-model/' + taxon.get('descriptor_meta_model') + '/layout/',
                    dataType: 'json',
                }).done(function (data) {
                    var taxonDescriptorView = new TaxonDescriptorView({
                        model: taxon,
                        descriptorMetaModelLayout: data
                    });
                    taxonLayout.getRegion('descriptors').show(taxonDescriptorView);
                });
            } else {
                var taxonDescriptorCreateView = new TaxonDescriptorCreateView({model: taxon});
                taxonLayout.getRegion('descriptors').show(taxonDescriptorCreateView);
            }
        });

        var taxonChildren = new TaxonChildrenCollection([], {model_id: id});

        taxonChildren.fetch().then(function() {
            var taxonChildrenView = new TaxonChildrenView({collection: taxonChildren, model: taxon});

            taxonLayout.getRegion('children-content').show(taxonChildrenView);
            taxonLayout.getRegion('children-bottom').show(new ScrollingMoreView({targetView: taxonChildrenView}));
        });

        var taxonEntities = new TaxonEntitiesCollection([], {model_id: id});

        taxonEntities.fetch().then(function() {
            var taxonEntitiesView = new TaxonEntitiesView({collection: taxonEntities, model: taxon});

            taxonLayout.getRegion('entities-content').show(taxonEntitiesView);
            taxonLayout.getRegion('entities-bottom').show(new ScrollingMoreView({targetView: taxonEntitiesView}));
        });
    },
});

module.exports = TaxonRouter;
