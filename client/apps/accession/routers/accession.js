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

// var AccessionCollection = require('../collections/accession');
// var BatchCollection = require('../collections/batch');

// var AccessionListView = require('../views/accessionlist');
// var BatchListView = require('../views/batchlist');
// var AccessionItemView = require('../views/accessionitem');
// var BatchItemView = require('../views/batchitem');

var DefaultLayout = require('../../main/views/defaultlayout');
var TitleView = require('../../main/views/titleview');

var Router = Marionette.AppRouter.extend({
    routes : {
        "app/accession/accession/": "getAccessionList",
        "app/accession/accession/create/:meta_model_id/": "getAccessionCreate",
        "app/accession/accession/:id/": "getAccession",
        "app/accession/accession/:id/batch/": "getBatchList",
        "app/accession/accession/:id/batch/:bid": "getBatch",
        "app/accession/accession/:id/batch/:bid/sample/": "getSampleList",
        "app/accession/accession/:id/batch/:bid/sample/:sid/": "getSample",
    },

    getAccessionList : function() {
        alert("Not yet implemented");
        // var collection = application.accession.collections.accession;
        //
        // var defaultLayout = new DefaultLayout({});
        // application.getRegion('mainRegion').show(defaultLayout);
        //
        // defaultLayout.getRegion('title').show(new TitleView({title: gt.gettext("List of accessions")}));
        //
        // collection.fetch().then(function () {
        //     defaultLayout.getRegion('content').show(new AccessionListView({read_only: true, collection : collection}));
        // });
    },

    getAccessionCreate: function(meta_model_id) {
        var model = application.accession.tmpAccession;
        delete application.accession.tmpAccession;

        //model.save({wait: true});
        // @todo create view with Create/Cancel buttons
    },

    getAccession : function(id) {
        alert("Not yet implemented");
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
