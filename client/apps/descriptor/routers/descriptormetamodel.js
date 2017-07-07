/**
 * @file descriptormetamodel.js
 * @brief Descriptor meta-model router
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-10-26
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Marionette = require('backbone.marionette');

var DescriptorMetaModelModel = require('../models/descriptormetamodel');

var DescriptorModelCollection = require('../collections/descriptormodel');
var DescriptorMetaModelCollection = require('../collections/descriptormetamodel');
var DescriptorPanelCollection = require('../collections/descriptorpanel');

var DescriptorMetaModelAddView = require('../views/descriptormetamodeladd');
var DescriptorMetaModelDetailView = require('../views/descriptormetamodeldetail');
var DescriptorMetaModelListView = require('../views/descriptormetamodellist');
var DescriptorPanelListView = require('../views/descriptorpanellist');

var DescriptorModelListAltView = require('../views/descriptormodellistalt');

var DefaultLayout = require('../../main/views/defaultlayout');
var TwoColumnsLayout = require('../../main/views/twocolumnslayout');
var TitleView = require('../../main/views/titleview');
var ScrollingMoreView = require('../../main/views/scrollingmore');

var Router = Marionette.AppRouter.extend({
    routes : {
        "app/descriptor/meta-model/": "getDescriptorMetaModelList",
        "app/descriptor/meta-model/:id/": "getDescriptorMetaModel",
        "app/descriptor/meta-model/:id/panel/": "getDescriptorPanelListForModel",
    },

    getDescriptorMetaModelList: function () {
        var collection = new DescriptorMetaModelCollection();

        var defaultLayout = new DefaultLayout({});
        application.main.showContent(defaultLayout);

        defaultLayout.showChildView('title', new TitleView({title: gt.gettext("List of meta-models of descriptor")}));

        collection.fetch().then(function () {
            var descriptorMetaModelList = new DescriptorMetaModelListView({collection : collection});
            defaultLayout.showChildView('content', descriptorMetaModelList);
            defaultLayout.showChildView('content-bottom', new ScrollingMoreView({targetView: descriptorMetaModelList}));
        });

        // @todo lookup for permission
        if (session.user.isAuth && (session.user.isSuperUser || session.user.isStaff)) {
            defaultLayout.showChildView('bottom', new DescriptorMetaModelAddView({collection: collection}));
        }
    },

    getDescriptorMetaModel: function (id) {
        var defaultLayout = new DefaultLayout();
        application.main.showContent(defaultLayout);

        var model = new DescriptorMetaModelModel({id: id});

        model.fetch().then(function () {
            defaultLayout.showChildView('title', new TitleView({title: gt.gettext("Details for the meta-model of descriptor"), object: model.get('name')}));
            defaultLayout.showChildView('content', new DescriptorMetaModelDetailView({model : model}));
        });
    },

    getDescriptorPanelListForModel: function(id) {
        var panelCollection = new DescriptorPanelCollection([], {model_id: id});

        var defaultLayout = new DefaultLayout({});
        application.main.showContent(defaultLayout);

        defaultLayout.showChildView('title', new TitleView({title: gt.gettext("List of panels of descriptor")}));

        var twoColumnsLayout = new TwoColumnsLayout({});
        defaultLayout.showChildView('content', twoColumnsLayout);

        panelCollection.fetch().then(function () {
            var descriptorPanelList = new DescriptorPanelListView({collection : panelCollection});
            twoColumnsLayout.showChildView('left-content', descriptorPanelList);
            twoColumnsLayout.showChildView('left-bottom', new ScrollingMoreView({targetView: descriptorPanelList}));
        });

        var modelCollection = new DescriptorModelCollection();
        modelCollection.fetch().then(function () {
            var descriptorModelList = new DescriptorModelListAltView({
                collection: modelCollection,
                layout: twoColumnsLayout
            });

            twoColumnsLayout.showChildView('right-content', descriptorModelList);
            twoColumnsLayout.showChildView('right-bottom', new ScrollingMoreView({targetView: descriptorModelList}));
        });
    },
});

module.exports = Router;
