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

var AccessionModel = require('../models/accession');
// var BatchModel = require('../models/batch');

var AccessionCollection = require('../collections/accession');
// var BatchCollection = require('../collections/batch');

var AccessionListView = require('../views/accessionlist');
// var BatchListView = require('../views/batchlist');
// var AccessionItemView = require('../views/accessionitem');
// var BatchItemView = require('../views/batchitem');

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
        var accession = new AccessionModel({id: id});

        var defaultLayout = new DefaultLayout();
        application.show(defaultLayout);

        var accessionLayout = new AccessionLayout({model: accession});

        accession.fetch().then(function() {
            defaultLayout.getRegion('title').show(new TitleView({title: gt.gettext("Accession"), model: accession}));
            defaultLayout.getRegion('content').show(accessionLayout);
        });
    },

    getBatchList : function(id) {
        alert("Le gras c'est la vie !");
    },

    getBatch : function(id) {
        alert("Pourquoi pas ?");
    },

    getSampleList : function(id) {
        alert("Cette fois-ci, on part avec les femmes ! HAHAAAHA !!!!");
    },

    getSample : function(id) {
        alert("Ça vous ennuie si je vomis ?");
    },
});

module.exports = Router;
