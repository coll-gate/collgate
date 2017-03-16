/**
 * @file descriptormodel.js
 * @brief Descriptor model router
 * @author Frederic SCHERMA
 * @date 2016-09-19
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var DescriptorModelModel = require('../models/descriptormodel');
var DescriptorModelCollection = require('../collections/descriptormodel');
var DescriptorGroupCollection = require('../collections/descriptorgroup');
var DescriptorModelTypeCollection = require('../collections/descriptormodeltype');

var DescriptorModelAddView = require('../views/descriptormodeladd');
var DescriptorModelDetailView = require('../views/descriptormodeldetail');
var DescriptorModelListView = require('../views/descriptormodellist');
var DescriptorModelTypeListView = require('../views/descriptormodeltypelist');

var DescriptorGroupListAltView = require('../views/descriptorgrouplistalt');
var DescriptorTypeListAltView = require('../views/descriptortypelistalt');

var DefaultLayout = require('../../main/views/defaultlayout');
var LeftOneRightTwoLayout = require('../../main/views/leftonerighttwolayout');
var TitleView = require('../../main/views/titleview');
var ScrollingMoreView = require('../../main/views/scrollingmore');

var Router = Marionette.AppRouter.extend({
    routes : {
        "app/descriptor/model/": "getDescriptorModelList",
        "app/descriptor/model/:id/": "getDescriptorModel",
        "app/descriptor/model/:id/type/": "getDescriptorModelTypeListForModel",
    },

    getDescriptorModelList: function () {
        var collection = new DescriptorModelCollection();

        var defaultLayout = new DefaultLayout({});
        application.show(defaultLayout);

        defaultLayout.getRegion('title').show(new TitleView({title: gt.gettext("List of models of descriptor")}));

        collection.fetch().then(function () {
            var descriptorModelList = new DescriptorModelListView({collection : collection});
            defaultLayout.getRegion('content').show(descriptorModelList);
            defaultLayout.getRegion('content-bottom').show(new ScrollingMoreView({targetView: descriptorModelList}));
        });

        // @todo lookup for permission
        if (session.user.isAuth && (session.user.isSuperUser || session.user.isStaff)) {
            defaultLayout.getRegion('bottom').show(new DescriptorModelAddView({collection: collection}));
        }
    },

    getDescriptorModel: function (id) {
        var defaultLayout = new DefaultLayout();
        application.show(defaultLayout);

        var model = new DescriptorModelModel({id: id});

        model.fetch().then(function () {
            defaultLayout.getRegion('title').show(new TitleView({title: gt.gettext("Details for the model of descriptor"), object: model.get('name')}));
            defaultLayout.getRegion('content').show(new DescriptorModelDetailView({model : model}));
        });
    },

    getDescriptorModelTypeListForModel: function(id) {
        var defaultLayout = new DefaultLayout({});
        application.show(defaultLayout);

        defaultLayout.getRegion('title').show(new TitleView({title: gt.gettext("List of types of models of descriptor")}));

        var leftOneRightTwoLayout = new LeftOneRightTwoLayout({});
        defaultLayout.getRegion('content').show(leftOneRightTwoLayout);

        var modelTypeCollection = new DescriptorModelTypeCollection([], {model_id: id});
        var groupCollection = new DescriptorGroupCollection();

        // need groups for model type so wait for the two collections to be done
        $.when(modelTypeCollection.fetch(), groupCollection.fetch()).done(function() {
            var descriptorTypeModelList = new DescriptorModelTypeListView({
                collection : modelTypeCollection,
                descriptor_type_groups: groupCollection});

            leftOneRightTwoLayout.getRegion('left-content').show(descriptorTypeModelList);
            leftOneRightTwoLayout.getRegion('left-bottom').show(new ScrollingMoreView({targetView: descriptorTypeModelList}));

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
    }
});

module.exports = Router;
