/**
 * @file descriptormodel.js
 * @brief Descriptor model router
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-09-19
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let Marionette = require('backbone.marionette');

let DescriptorModelModel = require('../models/descriptormodel');
let DescriptorModelCollection = require('../collections/descriptormodel');
let DescriptorGroupCollection = require('../collections/descriptorgroup');
let DescriptorModelTypeCollection = require('../collections/descriptormodeltype');

let DescriptorModelAddView = require('../views/descriptormodeladd');
let DescriptorModelDetailView = require('../views/descriptormodeldetail');
let DescriptorModelListView = require('../views/descriptormodellist');
let DescriptorModelTypeListView = require('../views/descriptormodeltypelist');

let DescriptorGroupListAltView = require('../views/descriptorgrouplistalt');
let DescriptorTypeListAltView = require('../views/descriptortypelistalt');

let DefaultLayout = require('../../main/views/defaultlayout');
let LeftOneRightTwoLayout = require('../../main/views/leftonerighttwolayout');
let TitleView = require('../../main/views/titleview');
let ScrollingMoreView = require('../../main/views/scrollingmore');

let Router = Marionette.AppRouter.extend({
    routes : {
        "app/descriptor/model/": "getDescriptorModelList",
        "app/descriptor/model/:id/": "getDescriptorModel",
        "app/descriptor/model/:id/type/": "getDescriptorModelTypeListForModel",
    },

    getDescriptorModelList: function () {
        let collection = new DescriptorModelCollection();

        let defaultLayout = new DefaultLayout({});
        application.main.showContent(defaultLayout);

        defaultLayout.showChildView('title', new TitleView({title: _t("List of models of descriptor")}));

        collection.fetch().then(function () {
            let descriptorModelList = new DescriptorModelListView({collection : collection});
            defaultLayout.showChildView('content', descriptorModelList);
            defaultLayout.showChildView('content-bottom', new ScrollingMoreView({targetView: descriptorModelList}));
        });

        // let descriptorModelList = new DescriptorModelListView({collection : collection});
        // defaultLayout.showChildView('content', descriptorModelList);
        // defaultLayout.showChildView('content-bottom', new ScrollingMoreView({targetView: descriptorModelList}));
        //
        // descriptorModelList.query();


        // @todo lookup for permission
        if (session.user.isAuth && (session.user.isSuperUser || session.user.isStaff)) {
            defaultLayout.showChildView('bottom', new DescriptorModelAddView({collection: collection}));
        }
    },

    getDescriptorModel: function (id) {
        let defaultLayout = new DefaultLayout();
        application.main.showContent(defaultLayout);

        let model = new DescriptorModelModel({id: id});

        model.fetch().then(function () {
            defaultLayout.showChildView('title', new TitleView({title: _t("Details for the model of descriptor"), object: model.get('name')}));
            defaultLayout.showChildView('content', new DescriptorModelDetailView({model : model}));
        });
    },

    getDescriptorModelTypeListForModel: function(id) {
        let defaultLayout = new DefaultLayout({});
        application.main.showContent(defaultLayout);

        defaultLayout.showChildView('title', new TitleView({title: _t("List of types of models of descriptor")}));

        let leftOneRightTwoLayout = new LeftOneRightTwoLayout({});
        defaultLayout.showChildView('content', leftOneRightTwoLayout);

        let modelTypeCollection = new DescriptorModelTypeCollection([], {model_id: id});
        let groupCollection = new DescriptorGroupCollection();

        // need groups for model type so wait for the two collections to be done
        $.when(modelTypeCollection.fetch(), groupCollection.fetch()).then(function() {
            let descriptorTypeModelList = new DescriptorModelTypeListView({
                collection : modelTypeCollection,
                descriptor_type_groups: groupCollection});

            leftOneRightTwoLayout.showChildView('left-content', descriptorTypeModelList);
            leftOneRightTwoLayout.showChildView('left-bottom', new ScrollingMoreView({targetView: descriptorTypeModelList}));

            let descriptorGroupList = new DescriptorGroupListAltView({
                collection: groupCollection,
                layout: leftOneRightTwoLayout
            });

            leftOneRightTwoLayout.showChildView('right-up-content', descriptorGroupList);
            leftOneRightTwoLayout.showChildView('right-up-bottom', new ScrollingMoreView({targetView: descriptorGroupList}));
        });

        let descriptorTypeList = new DescriptorTypeListAltView({});
        leftOneRightTwoLayout.showChildView('right-down-content', descriptorTypeList);
        leftOneRightTwoLayout.showChildView('right-down-bottom', new ScrollingMoreView({targetView: descriptorTypeList}));
    }
});

module.exports = Router;
