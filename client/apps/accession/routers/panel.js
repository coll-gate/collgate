/**
 * @file panel.js
 * @brief
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2017-09-12
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var Marionette = require('backbone.marionette');

var PanelModel = require('../models/panel');
var PanelCollection = require('../collections/panel');
var PanelListView = require('../views/panellist');
var EntityListFilterView = require('../../descriptor/views/entitylistfilter');
var DefaultLayout = require('../../main/views/defaultlayout');
var ScrollingMoreView = require('../../main/views/scrollingmore');
var TitleView = require('../../main/views/titleview');
var PanelLayout = require('../views/panellayout');

var Router = Marionette.AppRouter.extend({
    routes: {
        "app/accession/panel/": "getPanelList",
        "app/accession/panel/:id/*tab": "getPanel"
    },

    getPanelList: function (options) {
        options || (options = {});

        var collection = new PanelCollection({
            filters: (options.filters || {})
        });

        var defaultLayout = new DefaultLayout({});
        application.main.showContent(defaultLayout);

        defaultLayout.showChildView('title', new TitleView({title: _t("List of panels")}));

        // get available columns
        var columns = $.ajax({
            type: "GET",
            url: application.baseUrl + 'descriptor/columns/accession.accessionpanel/',
            contentType: "application/json; charset=utf-8"
        });

        columns.done(function (data) {
            var panelListView = new PanelListView({collection: collection, columns: data.columns});

            defaultLayout.showChildView('content', panelListView);
            defaultLayout.showChildView('content-bottom', new ScrollingMoreView({
                collection: collection,
                targetView: panelListView
            }));

            defaultLayout.showChildView('bottom', new EntityListFilterView({
                collection: collection, columns: data.columns
            }));

            panelListView.query();
        });
    },

    getPanel: function (id, tab) {
        tab || (tab = "descriptors");

        var panel = new PanelModel({id: id});

        var defaultLayout = new DefaultLayout();
        application.main.showContent(defaultLayout);

        panel.fetch().then(function () {
            if (!defaultLayout.isRendered()) {
                return;
            }

            defaultLayout.showChildView('title', new TitleView({title: _t("Panel"), model: panel}));

            var panelLayout = new PanelLayout({model: panel, initialTab: tab.replace('/', '')});
            defaultLayout.showChildView('content', panelLayout);
        });
    }
});

module.exports = Router;
