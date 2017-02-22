/**
 * @file batch.js
 * @brief Batch router
 * @author Frederic SCHERMA
 * @date 2017-02-14
 * @copyright Copyright (c) 2017 INRA UMR1095 GDEC
 * @license @todo
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
        "app/accession/accession/:id/batch/": "getAccessionBatchList",
        "app/accession/batch/:id/": "getBatch"
    },

    getAccessionBatchList : function(id) {
        var collection = new BatchCollection();

        var defaultLayout = new DefaultLayout({});
        application.show(defaultLayout);

        defaultLayout.getRegion('title').show(new TitleView({title: gt.gettext("List of batches for the accession")}));

        collection.fetch().then(function () {
            var batchListView = new BatchListView({collection : collection});

            defaultLayout.getRegion('content').show(batchListView);
            defaultLayout.getRegion('content-bottom').show(new ScrollingMoreView({targetView: batchListView}));
        });
    },

    getBatch : function(id) {
        var batch = new BatchModel({id: id});

        var defaultLayout = new DefaultLayout();
        application.show(defaultLayout);

        var batchLayout = new BatchLayout({model: batch});

        batch.fetch().then(function() {
            defaultLayout.getRegion('title').show(new TitleView({title: gt.gettext("Batch"), model: batch}));
            defaultLayout.getRegion('content').show(batchLayout);
        });
    }
});

module.exports = Router;
