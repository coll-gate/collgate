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
        application.show(defaultLayout);

        defaultLayout.getRegion('title').show(new TitleView({title: gt.gettext("List of meta-models of descriptor")}));

        collection.fetch().then(function () {
            var descriptorMetaModelList = new DescriptorMetaModelListView({collection : collection});
            defaultLayout.getRegion('content').show(descriptorMetaModelList);
            defaultLayout.getRegion('content-bottom').show(new ScrollingMoreView({targetView: descriptorMetaModelList}));
        });

        // @todo lookup for permission
        if (session.user.isAuth && (session.user.isSuperUser || session.user.isStaff)) {
            defaultLayout.getRegion('bottom').show(new DescriptorMetaModelAddView({collection: collection}));
        }
    },

    getDescriptorMetaModel: function (id) {
        var defaultLayout = new DefaultLayout();
        application.show(defaultLayout);

        var model = new DescriptorMetaModelModel({id: id});

        model.fetch().then(function () {
            defaultLayout.getRegion('title').show(new TitleView({title: gt.gettext("Details for the meta-model of descriptor"), object: model.get('name')}));
            defaultLayout.getRegion('content').show(new DescriptorMetaModelDetailView({model : model}));
        });
    },

    getDescriptorPanelListForModel: function(id) {
        var panelCollection = new DescriptorPanelCollection([], {model_id: id});

        var defaultLayout = new DefaultLayout({});
        application.show(defaultLayout);

        defaultLayout.getRegion('title').show(new TitleView({title: gt.gettext("List of panels of descriptor")}));

        var twoColumnsLayout = new TwoColumnsLayout({});
        defaultLayout.getRegion('content').show(twoColumnsLayout);

        panelCollection.fetch().then(function () {
            var descriptorPanelList = new DescriptorPanelListView({collection : panelCollection});
            twoColumnsLayout.getRegion('left-content').show(descriptorPanelList);
            twoColumnsLayout.getRegion('left-bottom').show(new ScrollingMoreView({targetView: descriptorPanelList}));
        });

        var modelCollection = new DescriptorModelCollection();
        modelCollection.fetch().then(function () {
            var descriptorModelList = new DescriptorModelListAltView({
                collection: modelCollection,
                layout: twoColumnsLayout
            });

            twoColumnsLayout.getRegion('right-content').show(descriptorModelList);
            twoColumnsLayout.getRegion('right-bottom').show(new ScrollingMoreView({targetView: descriptorModelList}));
        });
    },
});

module.exports = Router;

