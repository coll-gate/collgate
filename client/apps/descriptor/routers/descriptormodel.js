/**
 * @file descriptormodel.js
 * @brief Descriptor model router
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-09-19
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
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
        application.main.showContent(defaultLayout);

        defaultLayout.showChildView('title', new TitleView({title: _t("List of models of descriptor")}));

        collection.fetch().then(function () {
            var descriptorModelList = new DescriptorModelListView({collection : collection});
            defaultLayout.showChildView('content', descriptorModelList);
            defaultLayout.showChildView('content-bottom', new ScrollingMoreView({targetView: descriptorModelList}));
        });

        // @todo lookup for permission
        if (session.user.isAuth && (session.user.isSuperUser || session.user.isStaff)) {
            defaultLayout.showChildView('bottom', new DescriptorModelAddView({collection: collection}));
        }
    },

    getDescriptorModel: function (id) {
        var defaultLayout = new DefaultLayout();
        application.main.showContent(defaultLayout);

        var model = new DescriptorModelModel({id: id});

        model.fetch().then(function () {
            defaultLayout.showChildView('title', new TitleView({title: _t("Details for the model of descriptor"), object: model.get('name')}));
            defaultLayout.showChildView('content', new DescriptorModelDetailView({model : model}));
        });
    },

    getDescriptorModelTypeListForModel: function(id) {
        var defaultLayout = new DefaultLayout({});
        application.main.showContent(defaultLayout);

        defaultLayout.showChildView('title', new TitleView({title: _t("List of types of models of descriptor")}));

        var leftOneRightTwoLayout = new LeftOneRightTwoLayout({});
        defaultLayout.showChildView('content', leftOneRightTwoLayout);

        var modelTypeCollection = new DescriptorModelTypeCollection([], {model_id: id});
        var groupCollection = new DescriptorGroupCollection();

        // need groups for model type so wait for the two collections to be done
        $.when(modelTypeCollection.fetch(), groupCollection.fetch()).done(function() {
            var descriptorTypeModelList = new DescriptorModelTypeListView({
                collection : modelTypeCollection,
                descriptor_type_groups: groupCollection});

            leftOneRightTwoLayout.showChildView('left-content', descriptorTypeModelList);
            leftOneRightTwoLayout.showChildView('left-bottom', new ScrollingMoreView({targetView: descriptorTypeModelList}));

            var descriptorGroupList = new DescriptorGroupListAltView({
                collection: groupCollection,
                layout: leftOneRightTwoLayout
            });

            leftOneRightTwoLayout.showChildView('right-up-content', descriptorGroupList);
            leftOneRightTwoLayout.showChildView('right-up-bottom', new ScrollingMoreView({targetView: descriptorGroupList}));
        });

        var descriptorTypeList = new DescriptorTypeListAltView({});
        leftOneRightTwoLayout.showChildView('right-down-content', descriptorTypeList);
        leftOneRightTwoLayout.showChildView('right-down-bottom', new ScrollingMoreView({targetView: descriptorTypeList}));
    }
});

module.exports = Router;
