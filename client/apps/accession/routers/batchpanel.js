/**
 * @file batchpanel.js
 * @brief
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2017-11-03
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');

let PanelModel = require('../models/batchpanel');
let PanelCollection = require('../collections/batchpanel');
let PanelListView = require('../views/batch/panel/panellist');
let EntityListFilterView = require('../../descriptor/views/entitylistfilter');
let DefaultLayout = require('../../main/views/defaultlayout');
let ScrollingMoreView = require('../../main/views/scrollingmore');
let TitleView = require('../../main/views/titleview');
let PanelLayout = require('../views/batch/panel/panellayout');

let Router = Marionette.AppRouter.extend({
    routes: {
        "app/accession/batchpanel/": "getPanelList",
        "app/accession/batchpanel/:id/*tab": "getPanel"
    },

    getPanelList: function (options) {
        options || (options = {});

        let collection = new PanelCollection({
            filters: (options.filters || {})
        });

        let defaultLayout = new DefaultLayout({});
        application.main.showContent(defaultLayout);

        defaultLayout.showChildView('title', new TitleView({title: _t("List of batch panels")}));

        let columns = application.main.cache.lookup({
            type: 'entity_columns',
            format: {model: 'accession.batchpanel'}
        });

        columns.done(function (data) {
            let panelListView = new PanelListView({collection: collection, columns: data[0].value});

            defaultLayout.showChildView('content', panelListView);
            defaultLayout.showChildView('content-bottom', new ScrollingMoreView({
                collection: collection,
                targetView: panelListView
            }));

            defaultLayout.showChildView('bottom', new EntityListFilterView({
                collection: collection, columns: data[0].value
            }));

            panelListView.query();
        });
    },

    getPanel: function (id, tab) {
        tab || (tab = "descriptors");

        let panel = new PanelModel({id: id});

        let defaultLayout = new DefaultLayout();
        application.main.showContent(defaultLayout);

        panel.fetch().then(function () {
            if (!defaultLayout.isRendered()) {
                return;
            }

            defaultLayout.showChildView('title', new TitleView({title: _t("Batch panel"), model: panel}));

            let panelLayout = new PanelLayout({model: panel, initialTab: tab.replace('/', '')});
            defaultLayout.showChildView('content', panelLayout);
        });
    }
});

module.exports = Router;
