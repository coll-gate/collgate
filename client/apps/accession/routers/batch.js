/**
 * @file batch.js
 * @brief Batch router
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-02-14
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');

let BatchModel = require('../models/batch');
let BatchCollection = require('../collections/batch');
let BatchListView = require('../views/batch/batchlist');
let EntityListFilterView = require('../../descriptor/views/entitylistfilter');

let DefaultLayout = require('../../main/views/defaultlayout');
let ScrollingMoreView = require('../../main/views/scrollingmore');
let TitleView = require('../../main/views/titleview');
let BatchLayout = require('../views/batch/batchlayout');

let Router = Marionette.AppRouter.extend({
    routes: {
        "app/accession/batch/": "getBatchList",
        "app/accession/accession/:id/batch/": "getAccessionBatchList",
        "app/accession/batch/:id/*tab": "getBatch"
    },

    getBatchList: function (options) {
        options || (options = {});

        let collection = new BatchCollection([], {
            filters: (options.filters || {}),
            search: (options.search || {})
        });

        let defaultLayout = new DefaultLayout({});
        application.main.showContent(defaultLayout);

        defaultLayout.showChildView('title', new TitleView({title: _t("List of batches")}));

        let columns = application.main.cache.lookup({
            type: 'entity_columns',
            format: {model: 'accession.batch'}
        });

        columns.done(function (data) {
            let batchListView = new BatchListView({
                collection: collection, columns: data[0].value,
                onRender: function () {
                    this.onShowTab();
                }
            });

            defaultLayout.showChildView('content', batchListView);
            defaultLayout.showChildView('content-bottom', new ScrollingMoreView({targetView: batchListView}));
            defaultLayout.showChildView('bottom', new EntityListFilterView({
                collection: collection, columns: data[0].value
            }));

            batchListView.query();
        });
    },

    getAccessionBatchList: function (id) {
        let collection = new BatchCollection({accession_id: id});

        let defaultLayout = new DefaultLayout({});
        application.main.showContent(defaultLayout);

        defaultLayout.showChildView('title', new TitleView({title: _t("List of batches for the accession")}));

        // get available columns
        let columns = application.main.cache.lookup({
            type: 'entity_columns',
            format: {model: 'accession.batch'}
        });

        $.when(columns, collection.fetch()).then(function (data) {
            let batchListView = new BatchListView({collection: collection, columns: data[0].value});

            defaultLayout.showChildView('content', batchListView);
            defaultLayout.showChildView('content-bottom', new ScrollingMoreView({targetView: batchListView}));
        });
    },

    getBatch: function (id, tab) {
        tab || (tab = "");

        let batch = new BatchModel({id: id});

        let defaultLayout = new DefaultLayout();
        application.main.showContent(defaultLayout);

        batch.fetch().then(function () {
            if (!defaultLayout.isRendered()) {
                return;
            }
            defaultLayout.showChildView('title', new TitleView({title: _t("Batch"), model: batch}));

            let batchLayout = new BatchLayout({model: batch, initialTab: tab.replace('/', '')});
            defaultLayout.showChildView('content', batchLayout);
        });
    }
});

module.exports = Router;
