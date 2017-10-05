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
var EntityListFilterView = require('../../descriptor/views/entitylistfilter');

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

    getBatchList : function(options) {
        options || (options = {});

        var collection = new BatchCollection([], {
            filters: (options.filters || {}),
            search: (options.search || {})
        });

        var defaultLayout = new DefaultLayout({});
        application.main.showContent(defaultLayout);

        defaultLayout.showChildView('title', new TitleView({title: _t("List of all batches")}));

        var columns = application.main.cache.lookup({
            type: 'entity_columns',
            format: {model: 'accession.batch'}
        });

        $.when(columns, collection.fetch()).then(function (data) {
            var batchListView  = new BatchListView({collection: collection, columns: data[0].value});

            defaultLayout.showChildView('content', batchListView);
            defaultLayout.showChildView('content-bottom', new ScrollingMoreView({targetView: batchListView}));
            defaultLayout.showChildView('bottom', new EntityListFilterView({
                collection: collection, columns: data[0].value
            }));
        });
    },

    getAccessionBatchList : function(id) {
        var collection = new BatchCollection({accession_id: id});

        var defaultLayout = new DefaultLayout({});
        application.main.showContent(defaultLayout);

        defaultLayout.showChildView('title', new TitleView({title: _t("List of batches for the accession")}));

        // get available columns
        var columns = application.main.cache.lookup({
            type: 'entity_columns',
            format: {model: 'accession.batch'}
        });

        $.when(columns, collection.fetch()).then(function (data) {
            var batchListView = new BatchListView({collection : collection, columns: data[0].value});

            defaultLayout.showChildView('content', batchListView);
            defaultLayout.showChildView('content-bottom', new ScrollingMoreView({targetView: batchListView}));
        });
    },

    getBatch : function(id, tab) {
        tab || (tab = "");

        var batch = new BatchModel({id: id});

        var defaultLayout = new DefaultLayout();
        application.main.showContent(defaultLayout);

        var batchLayout = new BatchLayout({model: batch, initialTab: tab.replace('/', '')});

        batch.fetch().then(function() {
            defaultLayout.showChildView('title', new TitleView({title: _t("Batch"), model: batch}));
            defaultLayout.showChildView('content', batchLayout);
        });
    }
});

module.exports = Router;
