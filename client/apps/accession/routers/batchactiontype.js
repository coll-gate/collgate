/**
 * @file batchactiontype.js
 * @brief
 * @author Frederic SCHERMA (INRA UMR1095)
 * @date 2017-12-01
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');

let BatchActionTypeModel = require('../models/batchactiontype');
let BatchActionTypeCollection = require('../collections/batchactiontype');
let EntityListFilterView = require('../../descriptor/views/entitylistfilter');
let BatchActionTypeListView = require('../views/batchactiontype/batchactiontypelist');
let DefaultLayout = require('../../main/views/defaultlayout');
let ScrollingMoreView = require('../../main/views/scrollingmore');
let TitleView = require('../../main/views/titleview');
let BatchActionTypeLayout = require('../views/batchactiontype/batchactiontypelayout');

let Router = Marionette.AppRouter.extend({
    routes: {
        "app/accession/batchactiontype/": "getBatchActionTypeList",
        "app/accession/batchactiontype/:id/*tab": "getBatchActionType"
    },

    getBatchActionTypeList: function (options) {
        options || (options = {});

        let collection = new BatchActionTypeCollection({
            filters: (options.filters || {})
        });

        let defaultLayout = new DefaultLayout({});
        window.application.main.showContent(defaultLayout);

        defaultLayout.showChildView('title', new TitleView({title: _t("List of types of actions for batches")}));

        let columns = application.main.cache.lookup({
            type: 'entity_columns',
            format: {model: 'accession.batchactiontype'}
        });

        columns.done(function (data) {
            let batchActionTypeListView = new BatchActionTypeListView({collection: collection, columns: data[0].value});

            defaultLayout.showChildView('content', batchActionTypeListView);
            defaultLayout.showChildView('content-bottom', new ScrollingMoreView({
                collection: collection,
                targetView: batchActionTypeListView
            }));
console.log(data[0]);
            defaultLayout.showChildView('bottom', new EntityListFilterView({
                collection: collection, columns: data[0].value
            }));

            batchActionTypeListView.query();
        });
    },

    getBatchActionType: function (id, tab) {
        tab || (tab = "");

        let batchActionType = new BatchActionTypeModel({id: id});

        let defaultLayout = new DefaultLayout();
        window.application.main.showContent(defaultLayout);

        window.accession.fetch().then(function() {
            if (!defaultLayout.isRendered()) {
                return;
            }

            defaultLayout.showChildView('title', new TitleView({title: _t("Batch Action Type"), model: batchActionType}));

            let layout = new BatchActionTypeLayout({model: accession, initialTab: tab.replace('/', '')});
            defaultLayout.showChildView('content', layout);
        });
    }
});

module.exports = Router;
