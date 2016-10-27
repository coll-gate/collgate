/**
 * @file descriptormetamodel.js
 * @brief Descriptor meta-model router
 * @author Frederic SCHERMA
 * @date 2016-10-26
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var DescriptorMetaModelModel = require('../models/descriptormetamodel');
var DescriptorMetaModelCollection = require('../collections/descriptormetamodel');
//var DescriptorPanelCollection = require('../collections/descriptorpanel');

var DescriptorMetaModelAddView = require('../views/descriptormetamodeladd');
var DescriptorMetaModelDetailView = require('../views/descriptormetamodeldetail');
var DescriptorMetaModelListView = require('../views/descriptormetamodellist');
//var DescriptorPanelListView = require('../views/descriptorpanellist');

//var DescriptorModelListAltView = require('../views/descriptormodellistalt');

var DefaultLayout = require('../../main/views/defaultlayout');
var TwoColumnsLayout = require('../../main/views/twocolumnslayout');
var TitleView = require('../../main/views/titleview');
var ScrollingMoreView = require('../../main/views/scrollingmore');

var Router = Marionette.AppRouter.extend({
    routes : {
        "app/accession/descriptor/meta-model/": "getDescriptorMetaModelList",
        "app/accession/descriptor/meta-model/:id/": "getDescriptorMetaModel",
        "app/accession/descriptor/meta-model/:id/panel/": "getDescriptorPanelListForModel",
    },

    getDescriptorMetaModelList: function () {
        var collection = new DescriptorMetaModelCollection();

        var defaultLayout = new DefaultLayout({});
        application.getRegion('mainRegion').show(defaultLayout);

        defaultLayout.getRegion('title').show(new TitleView({title: gt.gettext("List of meta-models of descriptors")}));

        collection.fetch().then(function () {
            var descriptorMetaModelList = new DescriptorMetaModelListView({collection : collection});
            defaultLayout.getRegion('content').show(descriptorMetaModelList);
            defaultLayout.getRegion('content_bottom').show(new ScrollingMoreView({targetView: descriptorMetaModelList}));
        });

        // @todo lookup for permission
        if (session.user.isAuth && (session.user.isSuperUser || session.user.isStaff)) {
            defaultLayout.getRegion('bottom').show(new DescriptorMetaModelAddView({collection: collection}));
        }
    },

    getDescriptorMetaModel: function (id) {
        var defaultLayout = new DefaultLayout();
        application.getRegion('mainRegion').show(defaultLayout);

        var model = new DescriptorMetaModelModel({id: id});

        model.fetch().then(function () {
            defaultLayout.getRegion('title').show(new TitleView({title: gt.gettext("Details for the meta-model of descriptor"), object: model.get('name')}));
            defaultLayout.getRegion('content').show(new DescriptorMetaModelDetailView({model : model}));
        });
    },
/*
    getDescriptorModelTypeListForModel: function(id) {
        var modelTypeCollection = new DescriptorModelTypeCollection([], {model_id: id});

        var defaultLayout = new DefaultLayout({});
        application.getRegion('mainRegion').show(defaultLayout);

        defaultLayout.getRegion('title').show(new TitleView({title: gt.gettext("List of types of models of descriptors")}));

        var leftOneRightTwoLayout = new LeftOneRightTwoLayout({});
        defaultLayout.getRegion('content').show(leftOneRightTwoLayout);

        modelTypeCollection.fetch().then(function () {
            var descriptorTypeModelList = new DescriptorModelTypeListView({collection : modelTypeCollection});
            leftOneRightTwoLayout.getRegion('left-content').show(descriptorTypeModelList);
            leftOneRightTwoLayout.getRegion('left-bottom').show(new ScrollingMoreView({targetView: descriptorTypeModelList}));
        });

        var groupCollection = new DescriptorGroupCollection();
        groupCollection.fetch().then(function () {
            var descriptorGroupList = new DescriptorGroupListAltView({
                collection: groupCollection,
                layout: leftOneRightTwoLayout
            });

            leftOneRightTwoLayout.getRegion('right-up-content').show(descriptorGroupList);
            leftOneRightTwoLayout.getRegion('right-up-bottom').show(new ScrollingMoreView({targetView: descriptorGroupList}));
        });

        var descriptorTypeList = new DescriptorTypeListAltView({});
        leftOneRightTwoLayout.getRegion('right-down-content').show(descriptorTypeList);
        leftOneRightTwoLayout.getRegion('right-down-bottom').show(new ScrollingMoreView({targetView: descriptorTypeList}));
    },*/
});

module.exports = Router;
