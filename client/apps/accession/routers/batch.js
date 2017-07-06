/**
 * @file batch.js
 * @brief Batch router
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-02-14
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Marionette = require('backbone.marionette');

var BatchModel = require('../models/batch');
var BatchCollection = require('../collections/batch');
var BatchListView = require('../views/batchlist');

var DefaultLayout = require('../../main/views/defaultlayout');
var ScrollingMoreView = require('../../main/views/scrollingmore');
var TitleView = require('../../main/views/titleview');
var BatchLayout = require('../views/batchlayout');

var Router = Marionette.AppRouter.extend({
    routes : {
        "app/accession/batch/": "getBatchList",
        "app/accession/accession/:id/batch/": "getAccessionBatchList",
        "app/accession/batch/:id/*tab": "getBatch"
    },

    getBatchList : function() {
        var collection = new BatchCollection();

        var defaultLayout = new DefaultLayout({});
        application.main.showContent(defaultLayout);

        defaultLayout.getRegion('title').show(new TitleView({title: gt.gettext("List of all batches")}));

        // get available columns
        var columns = $.ajax({
            type: "GET",
            url: application.baseUrl + 'descriptor/columns/accession.batch/',
            contentType: "application/json; charset=utf-8"
        });

        $.when(columns, collection.fetch()).done(function (data) {
            var batchListView  = new BatchListView({collection: collection, columns: data[0].columns});

            defaultLayout.getRegion('content').show(batchListView);
            defaultLayout.getRegion('content-bottom').show(new ScrollingMoreView({targetView: batchListView}));
        });
    },

    getAccessionBatchList : function(id) {
        var collection = new BatchCollection({accession_id: id});

        var defaultLayout = new DefaultLayout({});
        application.main.showContent(defaultLayout);

        defaultLayout.getRegion('title').show(new TitleView({title: gt.gettext("List of batches for the accession")}));

        // get available columns
        var columns = $.ajax({
            type: "GET",
            url: application.baseUrl + 'descriptor/columns/accession.batch/',
            contentType: "application/json; charset=utf-8"
        });

        $.when(columns, collection.fetch()).done(function (data) {
            var batchListView = new BatchListView({collection : collection, columns: data[0].columns});

            defaultLayout.getRegion('content').show(batchListView);
            defaultLayout.getRegion('content-bottom').show(new ScrollingMoreView({targetView: batchListView}));
        });
    },

    getBatch : function(id, tab) {
        tab || (tab = "");

        var batch = new BatchModel({id: id});

        var defaultLayout = new DefaultLayout();
        application.main.showContent(defaultLayout);

        var batchLayout = new BatchLayout({model: batch, initialTab: tab.replace('/', '')});

        batch.fetch().then(function() {
            defaultLayout.getRegion('title').show(new TitleView({title: gt.gettext("Batch"), model: batch}));
            defaultLayout.getRegion('content').show(batchLayout);
        });
    }
});

module.exports = Router;
