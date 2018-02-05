/**
 * @file layout.js
 * @brief Descriptor layout router
 * @author Frédéric SCHERMA (INRA UMR1095), Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2016-10-26
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');
let LayoutModel = require('../models/layout');
let LayoutCollection = require('../collections/layout');
let DescriptorPanelCollection = require('../collections/descriptorpanel');
let LayoutAddView = require('../views/descriptormetamodeladd');
let LayoutListView = require('../views/layoutlist');
let DefaultLayout = require('../../main/views/defaultlayout');
let TitleView = require('../../main/views/titleview');
let ScrollingMoreView = require('../../main/views/scrollingmore');

let Router = Marionette.AppRouter.extend({
    routes: {
        "app/descriptor/layout/": "getLayoutList",
        "app/descriptor/layout/:id/": "getLayout"
    },

    getLayoutList: function () {
        let collection = new LayoutCollection();

        let defaultLayout = new DefaultLayout({});
        window.application.main.showContent(defaultLayout);

        defaultLayout.showChildView('title', new TitleView({title: _t("List of layouts")}));

        collection.fetch().then(function () {
            let layoutList = new LayoutListView({collection: collection});
            defaultLayout.showChildView('content', layoutList);
            defaultLayout.showChildView('content-bottom', new ScrollingMoreView({targetView: layoutList}));
        });

        // @todo lookup for permission
        if (window.session.user.isAuth && (window.session.user.isSuperUser || window.session.user.isStaff)) {
            defaultLayout.showChildView('bottom', new LayoutAddView({collection: collection}));
        }
    },

    getLayout: function (id) {
        // Layout editor
        let panelCollection = new DescriptorPanelCollection([], {model_id: id});
        let layout = new LayoutModel({id: id});

        let defaultLayout = new DefaultLayout({});
        window.application.main.showContent(defaultLayout);

        layout.fetch().then(function () {
            defaultLayout.showChildView('title', new TitleView({
                title: _t("Layout editor"),
                model: layout
            }));
        });

        let LayoutEditor = require('../views/layouteditor');
        panelCollection.fetch().then(function () {
            let layoutEditor = new LayoutEditor({collection: panelCollection});
            defaultLayout.showChildView('content', layoutEditor);
        });
    },
});

module.exports = Router;
