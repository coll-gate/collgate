/**
 * @file indexation.js
 * @brief
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2018-02-15
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');

let DefaultLayout = require('../../main/views/defaultlayout');
let TitleView = require('../../main/views/titleview');
let ScrollingMoreView = require('../../main/views/scrollingmore');
let EntityListFilterView = require('../../descriptor/views/entitylistfilter');

let IndexCollection = require('../../descriptor/collections/index');
let IndexListView = require('../../descriptor/views/descriptorindexlist');

let Router = Marionette.AppRouter.extend({
    routes: {
        "app/descriptor/index/": "getIndexList",
        // "app/descriptor/index/:id/": "getIndex",
    },

    getIndexList: function (options) {
        options || (options = {});

        let collection = new IndexCollection([], {
            filters: (options.filters || {}),
            search: (options.search || {})
        });

        let defaultLayout = new DefaultLayout({});
        window.application.main.showContent(defaultLayout);
        defaultLayout.showChildView('title', new TitleView({title: _t("List of descriptor indexes")}));

        // get available columns
        let columns = window.application.main.cache.lookup({
            type: 'entity_columns',
            format: {model: 'descriptor.descriptorindex'}
        });

        columns.done(function (data) {
            let indexListView = new IndexListView({read_only: true, collection: collection, columns: data[0].value});

            defaultLayout.showChildView('content', indexListView);
            defaultLayout.showChildView('content-bottom', new ScrollingMoreView({
                targetView: indexListView,
                collection: collection
            }));

            defaultLayout.showChildView('bottom', new EntityListFilterView({
                collection: collection, columns: data[0].value
            }));

            indexListView.query();
        });
    },

    // getIndex : function(tid) {
    //     let defaultLayout = new DefaultLayout();
    //     window.application.main.showContent(defaultLayout);
    //
    //     // let model = new DescriptorModel({id: tid});
    //     //
    //     // model.fetch().then(function () {
    //     //     defaultLayout.showChildView('title', new TitleView({title: _t("Details for the descriptor index"), model: model}));
    //         // defaultLayout.showChildView('content', new DescriptorLayout({model: model, initialTab: tab.replace('/', '')}));
    //     // });
    // },
});

module.exports = Router;