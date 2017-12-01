/**
 * @file descriptormetamodel.js
 * @brief Descriptor meta-model router
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-10-26
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');

let DescriptorMetaModelModel = require('../models/descriptormetamodel');

let DescriptorModelCollection = require('../collections/descriptormodel');
let DescriptorMetaModelCollection = require('../collections/descriptormetamodel');
let DescriptorPanelCollection = require('../collections/descriptorpanel');

let DescriptorMetaModelAddView = require('../views/descriptormetamodeladd');
let DescriptorMetaModelDetailView = require('../views/descriptormetamodeldetail');
let DescriptorMetaModelListView = require('../views/descriptormetamodellist');
let DescriptorPanelListView = require('../views/descriptorpanellist');

let DescriptorModelListAltView = require('../views/descriptormodellistalt');

let DefaultLayout = require('../../main/views/defaultlayout');
let TwoColumnsLayout = require('../../main/views/twocolumnslayout');
let TitleView = require('../../main/views/titleview');
let ScrollingMoreView = require('../../main/views/scrollingmore');

let Router = Marionette.AppRouter.extend({
    routes: {
        "app/descriptor/meta-model/": "getDescriptorMetaModelList",
        "app/descriptor/meta-model/:id/": "getDescriptorMetaModel",
        "app/descriptor/layout/:id/": "getDescriptorLayout",
        "app/descriptor/meta-model/:id/panel/": "getDescriptorPanelListForModel",
    },

    getDescriptorMetaModelList: function () {
        let collection = new DescriptorMetaModelCollection();

        let defaultLayout = new DefaultLayout({});
        application.main.showContent(defaultLayout);

        defaultLayout.showChildView('title', new TitleView({title: _t("List of meta-models of descriptor")}));

        collection.fetch().then(function () {
            let descriptorMetaModelList = new DescriptorMetaModelListView({collection: collection});
            defaultLayout.showChildView('content', descriptorMetaModelList);
            defaultLayout.showChildView('content-bottom', new ScrollingMoreView({targetView: descriptorMetaModelList}));
        });

        // @todo lookup for permission
        if (session.user.isAuth && (session.user.isSuperUser || session.user.isStaff)) {
            defaultLayout.showChildView('bottom', new DescriptorMetaModelAddView({collection: collection}));
        }
    },

    getDescriptorMetaModel: function (id) {
        let defaultLayout = new DefaultLayout();
        application.main.showContent(defaultLayout);

        let model = new DescriptorMetaModelModel({id: id});

        model.fetch().then(function () {
            defaultLayout.showChildView('title', new TitleView({
                title: _t("Details for the meta-model of descriptor"),
                object: model.get('name')
            }));
            defaultLayout.showChildView('content', new DescriptorMetaModelDetailView({model: model}));
        });
    },

    getDescriptorLayout: function (id) {
        // Layout editor

        let panelCollection = new DescriptorPanelCollection([], {model_id: id});
        let metaModel = new DescriptorMetaModelModel({id: id});

        let defaultLayout = new DefaultLayout({});
        application.main.showContent(defaultLayout);

        metaModel.fetch().then(function () {
            defaultLayout.showChildView('title', new TitleView({
                title: _t("Layout editor"),
                object: metaModel.get('name')
            }));
        });

        let LayoutEditor = require('../views/layouteditor');
        panelCollection.fetch().then(function () {
            let layoutEditor = new LayoutEditor({collection: panelCollection});
            defaultLayout.showChildView('content', layoutEditor);
        });
    },

    getDescriptorPanelListForModel: function (id) {
        let panelCollection = new DescriptorPanelCollection([], {model_id: id});

        let defaultLayout = new DefaultLayout({});
        application.main.showContent(defaultLayout);

        defaultLayout.showChildView('title', new TitleView({title: _t("List of panels of descriptor")}));

        let twoColumnsLayout = new TwoColumnsLayout({});
        defaultLayout.showChildView('content', twoColumnsLayout);

        panelCollection.fetch().then(function () {
            let descriptorPanelList = new DescriptorPanelListView({collection: panelCollection});
            twoColumnsLayout.showChildView('left-content', descriptorPanelList);
            twoColumnsLayout.showChildView('left-bottom', new ScrollingMoreView({targetView: descriptorPanelList}));
        });

        let modelCollection = new DescriptorModelCollection();
        modelCollection.fetch().then(function () {
            let descriptorModelList = new DescriptorModelListAltView({
                collection: modelCollection,
                layout: twoColumnsLayout
            });

            twoColumnsLayout.showChildView('right-content', descriptorModelList);
            twoColumnsLayout.showChildView('right-bottom', new ScrollingMoreView({targetView: descriptorModelList}));
        });
    },
});

module.exports = Router;
