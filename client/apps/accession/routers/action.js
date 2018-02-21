/**
 * @file action.js
 * @brief
 * @author Frederic SCHERMA (INRA UMR1095)
 * @date 2018-02-15
 * @copyright Copyright (c) 2018 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');

let ActionModel = require('../models/action');
let ActionCollection = require('../collections/action');
let EntityListFilterView = require('../../descriptor/views/entitylistfilter');
let ActionListView = require('../views/action/actionlist');
let DefaultLayout = require('../../main/views/defaultlayout');
let ScrollingMoreView = require('../../main/views/scrollingmore');
let TitleView = require('../../main/views/titleview');
let ActionLayout = require('../views/action/actionlayout');

let Router = Marionette.AppRouter.extend({
    routes: {
        "app/accession/action/": "getActionList",
        "app/accession/action/:id/*tab": "getAction"
    },

    getActionList: function (options) {
        options || (options = {});

        let collection = new ActionCollection({
            filters: (options.filters || {})
        });

        let defaultLayout = new DefaultLayout({});
        window.application.main.showContent(defaultLayout);

        defaultLayout.showChildView('title', new TitleView({title: _t("List of action")}));

        let columns = window.application.main.cache.lookup({
            type: 'entity_columns',
            format: {model: 'accession.action'}
        });

        columns.done(function (data) {
            let actionListView = new ActionListView({collection: collection, columns: data[0].value});

            defaultLayout.showChildView('content', actionListView);
            defaultLayout.showChildView('content-bottom', new ScrollingMoreView({
                collection: collection,
                targetView: actionListView
            }));

            defaultLayout.showChildView('bottom', new EntityListFilterView({
                collection: collection, columns: data[0].value
            }));

            actionListView.query();
        });
    },

    getAction: function (id, tab) {
        tab || (tab = "");

        let action = new ActionModel({id: id});

        let defaultLayout = new DefaultLayout();
        window.application.main.showContent(defaultLayout);

        action.fetch().then(function() {
            if (!defaultLayout.isRendered()) {
                return;
            }

            defaultLayout.showChildView('title', new TitleView({title: _t("Action"), model: action}));

            let actionLayout = new ActionLayout({model: action, initialTab: tab.replace('/', '')});
            defaultLayout.showChildView('content', actionLayout);
        });
    }
});

module.exports = Router;
