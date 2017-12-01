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
let PanelLayout = require('../views/batch/panel/panellayout');

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

            defaultLayout.showChildView('bottom', new EntityListFilterView({
                collection: collection, columns: data[0].value
            }));

            batchActionTypeListView.query();
        });
    },

    getBatchActionType: function (id, tab) {
        alert("@todo")
    }
});

module.exports = Router;
