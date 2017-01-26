/**
 * @file accession.js
 * @brief Accession router
 * @author Frederic SCHERMA
 * @date 2016-07-19
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var TaxonModel = require('../../taxonomy/models/taxon');
var AccessionModel = require('../models/accession');
// var BatchModel = require('../models/batch');

var AccessionCollection = require('../collections/accession');
// var BatchCollection = require('../collections/batch');

var EntityPathView = require('../../taxonomy/views/entitypath');
var AccessionListView = require('../views/accessionlist');
// var BatchListView = require('../views/batchlist');
// var AccessionItemView = require('../views/accessionitem');
// var BatchItemView = require('../views/batchitem');
var AccessionDetailsView = require('../views/accessiondetails');
var AccessionSynonymsView = require('../views/accessionsynonyms');

var DefaultLayout = require('../../main/views/defaultlayout');
var ScrollingMoreView = require('../../main/views/scrollingmore');
var TitleView = require('../../main/views/titleview');
var AccessionLayout = require('../views/accessionlayout');

var Router = Marionette.AppRouter.extend({
    routes : {
        "app/accession/accession/": "getAccessionList",
        "app/accession/accession/:id/": "getAccession",
        "app/accession/accession/:id/batch/": "getBatchList",
        "app/accession/accession/:id/batch/:bid": "getBatch",
        "app/accession/accession/:id/batch/:bid/sample/": "getSampleList",
        "app/accession/accession/:id/batch/:bid/sample/:sid/": "getSample",
    },

    getAccessionList : function() {
        var collection = new AccessionCollection();

        var defaultLayout = new DefaultLayout({});
        application.show(defaultLayout);

        defaultLayout.getRegion('title').show(new TitleView({title: gt.gettext("List of accessions")}));

        collection.fetch().then(function () {
            var accessionListView = new AccessionListView({collection : collection});

            defaultLayout.getRegion('content').show(accessionListView);
            defaultLayout.getRegion('content-bottom').show(new ScrollingMoreView({targetView: accessionListView}));
        });
    },

    getAccession : function(id) {
        var defaultLayout = new DefaultLayout();
        application.show(defaultLayout);

        var accessionLayout = new AccessionLayout();
        defaultLayout.getRegion('content').show(accessionLayout);

        var model = new AccessionModel({id: id});
        model.fetch().then(function() {
            var taxon = new TaxonModel({id: model.get('parent')});
            taxon.fetch().then(function() {
                accessionLayout.getRegion('details').show(new EntityPathView({model: model, taxon: taxon}));
            });

            defaultLayout.getRegion('title').show(new TitleView({title: gt.gettext("Accession"), model: model}));

            // get the layout before creating the view
            $.ajax({
                method: "GET",
                url: application.baseUrl + 'descriptor/meta-model/' + model.get('descriptor_meta_model') + '/layout/',
                dataType: 'json',
            }).done(function(data) {
                var accessionDetailsView = new AccessionDetailsView({model: model, descriptorMetaModelLayout: data});
                accessionLayout.getRegion('descriptors').show(accessionDetailsView);
            });

            var accessionSynonymsView = new AccessionSynonymsView({model: model});
            accessionLayout.getRegion('synonyms').show(accessionSynonymsView);
        });
    },

    getBatchList : function(id) {
        alert("Not yet implemented");
    },

    getBatch : function(id) {
        alert("Not yet implemented");
    },

    getSampleList : function(id) {
        alert("Not yet implemented");
    },

    getSample : function(id) {
        alert("Not yet implemented");
    },
});

module.exports = Router;
