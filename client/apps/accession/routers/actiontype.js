/**
 * @file actiontype.js
 * @brief
 * @author Frederic SCHERMA (INRA UMR1095)
 * @date 2017-12-01
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');

let ActionTypeModel = require('../models/actiontype');
let ActionTypeCollection = require('../collections/actiontype');
let EntityListFilterView = require('../../descriptor/views/entitylistfilter');
let ActionTypeListView = require('../views/action/actiontypelist');
let DefaultLayout = require('../../main/views/defaultlayout');
let ScrollingMoreView = require('../../main/views/scrollingmore');
let TitleView = require('../../main/views/titleview');
let ActionTypeLayout = require('../views/action/actiontypelayout');

let Router = Marionette.AppRouter.extend({
    routes: {
        "app/accession/actiontype/": "getActionTypeList",
        "app/accession/actiontype/:id/*tab": "getActionType"
    },

    getActionTypeList: function (options) {
        options || (options = {});

        let collection = new ActionTypeCollection({
            filters: (options.filters || {})
        });

        let defaultLayout = new DefaultLayout({});
        window.application.main.showContent(defaultLayout);

        defaultLayout.showChildView('title', new TitleView({title: _t("List of types of actions")}));

        let columns = window.application.main.cache.lookup({
            type: 'entity_columns',
            format: {model: 'accession.actiontype'}
        });

        columns.done(function (data) {
            let actionTypeListView = new ActionTypeListView({collection: collection, columns: data[0].value});

            defaultLayout.showChildView('content', actionTypeListView);
            defaultLayout.showChildView('content-bottom', new ScrollingMoreView({
                collection: collection,
                targetView: actionTypeListView
            }));

            defaultLayout.showChildView('bottom', new EntityListFilterView({
                collection: collection, columns: data[0].value
            }));

            actionTypeListView.query();
        });
    },

    getActionType: function (id, tab) {
        tab || (tab = "");

        let actionType = new ActionTypeModel({id: id});

        let defaultLayout = new DefaultLayout();
        window.application.main.showContent(defaultLayout);

        actionType.fetch().then(function() {
            if (!defaultLayout.isRendered()) {
                return;
            }

            defaultLayout.showChildView('title', new TitleView({title: _t("Type of action"), model: actionType}));

            let actionTypeLayout = new ActionTypeLayout({model: actionType, initialTab: tab.replace('/', '')});
            defaultLayout.showChildView('content', actionTypeLayout);
        });
    }
});

module.exports = Router;
