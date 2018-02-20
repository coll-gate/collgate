/**
 * @file descriptor.js
 * @brief Descriptor router
 * @author Frédéric SCHERMA (INRA UMR1095), Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2016-07-19
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');
let DescriptorGroupListView = require('../views/descriptorlist');
let DescriptorLayout = require('../views/descriptorlayout');
let DefaultLayout = require('../../main/views/defaultlayout');
let TitleView = require('../../main/views/titleview');
let ScrollingMoreView = require('../../main/views/scrollingmore');
let DescriptorCollection = require('../collections/descriptor');
let EntityListFilterView = require('../../descriptor/views/entitylistfilter');
let DescriptorModel = require('../models/descriptor');

let Router = Marionette.AppRouter.extend({
    routes: {
        "app/descriptor/descriptor/": "getIndexList",
        "app/descriptor/descriptor/:id/*tab": "getDescriptor",
    },

    getIndexList: function (options) {
        options || (options = {});

        let collection = new DescriptorCollection([], {
            filters: (options.filters || {}),
            search: (options.search || {})
        });

        let defaultLayout = new DefaultLayout({});
        window.application.main.showContent(defaultLayout);
        defaultLayout.showChildView('title', new TitleView({title: _t("List of descriptors")}));

        // get available columns
        let columns = window.application.main.cache.lookup({
            type: 'entity_columns',
            format: {model: 'descriptor.descriptor'}
        });

        columns.done(function (data) {
            let descriptorGroupListView = new DescriptorGroupListView({read_only: true, collection: collection, columns: data[0].value});

            defaultLayout.showChildView('content', descriptorGroupListView);
            defaultLayout.showChildView('content-bottom', new ScrollingMoreView({
                targetView: descriptorGroupListView,
                collection: collection
            }));

            defaultLayout.showChildView('bottom', new EntityListFilterView({
                collection: collection, columns: data[0].value
            }));

            descriptorGroupListView.query();
        });
    },

    getDescriptor : function(tid, tab) {
        tab || (tab = "");

        let defaultLayout = new DefaultLayout();
        window.application.main.showContent(defaultLayout);

        let model = new DescriptorModel({id: tid});

        model.fetch().then(function () {
            defaultLayout.showChildView('title', new TitleView({title: _t("Details for the descriptor"), model: model}));
            defaultLayout.showChildView('content', new DescriptorLayout({model: model, initialTab: tab.replace('/', '')}));
        });
    },
});

module.exports = Router;
