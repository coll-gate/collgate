/**
 * @file descriptor.js
 * @brief Descriptor router
 * @author Frédéric SCHERMA (INRA UMR1095), Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2016-07-19
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');
let DescriptorGroupModel = require('../models/descriptorgroup');
let DescriptorTypeModel = require('../models/descriptortype');
let DescriptorTypeCollection = require('../collections/descriptortype');
let DescriptorValueCollection = require('../collections/descriptorvalue');
let DescriptorGroupListView = require('../views/descriptorlist');
let DescriptorTypeListView = require('../views/descriptortypelist');
let DescriptorValueListView = require('../views/descriptorvaluelist');

let DescriptorValuePairListView = require('../views/descriptorvaluepairlist');
let DescriptorValueOrdinalListView = require('../views/descriptorvalueordinallist');
let DescriptorValueAddView = require('../views/descriptorvalueadd');
let DescriptorDetailsLayout = require('../views/descriptorlayout');

let DefaultLayout = require('../../main/views/defaultlayout');
let TitleView = require('../../main/views/titleview');
let ScrollingMoreView = require('../../main/views/scrollingmore');
let DescriptorGroupAddView = require('../views/descriptorgroupadd');

let DescriptorGroupTypeAddView = require('../views/descriptorgrouptypeadd');
let DescriptorCollection = require('../collections/descriptor');

let EntityListFilterView = require('../../descriptor/views/entitylistfilter');
let DescriptorModel = require('../models/descriptor');

let Router = Marionette.AppRouter.extend({
    routes: {
        "app/descriptor/descriptor/": "getDescriptorList",
        "app/descriptor/descriptor/:id/*tab": "getDescriptor",
        // "app/descriptor/descriptor/:id/value/": "getDescriptorValueList",
        // "app/descriptor/descriptor/:id/value/:id/": "getDescriptorValue",

        // "app/descriptor/group/": "getDescriptorGroupList",
        // "app/descriptor/group/:id/type/": "getDescriptorTypeListForGroup",
        // "app/descriptor/group/:id/type/:id/": "getDescriptorTypeForGroup",
        // "app/descriptor/group/:id/type/:id/value/": "getDescriptorValueListForType",
        // "app/descriptor/group/:id/type/:id/value/:id": "getDescriptorValueForType"
    },

    getDescriptorList: function (options) {
        options || (options = {});

        let collection = new DescriptorCollection([], {
            filters: (options.filters || {}),
            search: (options.search || {})
        });

        let defaultLayout = new DefaultLayout({});
        application.main.showContent(defaultLayout);

        defaultLayout.showChildView('title', new TitleView({title: _t("List of descriptors")}));

        // get available columns
        let columns = window.application.main.cache.lookup({
            type: 'entity_columns',
            format: {model: 'descriptor.descriptor'}
        });

        columns.done(function (data) {
            let descriptorGroupListView = new DescriptorGroupListView({read_only: true, collection: collection, columns: data[0].value});

            defaultLayout.showChildView('content', descriptorGroupListView);
            defaultLayout.showChildView('content-bottom', new ScrollingMoreView({
                targetView: descriptorGroupListView,
                collection: collection
            }));

            defaultLayout.showChildView('bottom', new EntityListFilterView({
                collection: collection, columns: data[0].value
            }));

            descriptorGroupListView.query();

            // todo: replace following lines with a context menu (add descriptor)
            // if (window.session.user.isAuth && (window.session.user.isSuperUser || window.session.user.isStaff)) {
            //     defaultLayout.showChildView('bottom', new DescriptorGroupAddView({collection: collection}));
            // }
        });
    },

    getDescriptor : function(tid, tab) {
        tab || (tab = "");

        let defaultLayout = new DefaultLayout();
        application.main.showContent(defaultLayout);

        let model = new DescriptorModel({id: tid});

        model.fetch().then(function () {
            defaultLayout.showChildView('title', new TitleView({title: _t("Details for the descriptor"), model: model}));
            defaultLayout.showChildView('content', new DescriptorDetailsLayout({model: model, initialTab: tab.replace('/', '')}));
        });
    },

    // getDescriptorGroupList : function() {
    //     let collection = application.descriptor.collections.descriptorGroup;
    //
    //     let defaultLayout = new DefaultLayout({});
    //     application.main.showContent(defaultLayout);
    //
    //     defaultLayout.showChildView('title', new TitleView({title: _t("List of groups of descriptors")}));
    //
    //     let descriptorGroupListView = new DescriptorGroupListView({read_only: true, collection: collection});
    //
    //     defaultLayout.showChildView('content', descriptorGroupListView);
    //     defaultLayout.showChildView('content-bottom', new ScrollingMoreView({
    //         targetView: descriptorGroupListView,
    //         collection: collection
    //     }));
    //
    //     descriptorGroupListView.query();
    //
    //     if (window.session.user.isAuth && (window.session.user.isSuperUser || window.session.user.isStaff)) {
    //         defaultLayout.showChildView('bottom', new DescriptorGroupAddView({collection: collection}));
    //     }
    // },
    //
    // getDescriptorTypeListForGroup : function(id) {
    //     let collection = new DescriptorTypeCollection([], {group_id: id});
    //
    //     let defaultLayout = new DefaultLayout();
    //     application.main.showContent(defaultLayout);
    //
    //     let model = new DescriptorGroupModel({id: id});
    //     model.fetch().then(function () {
    //         defaultLayout.showChildView('title', new TitleView({title: _t("Types of descriptors for the group"), model: model}));
    //
    //         // @todo lookup for permission
    //         if (window.session.user.isAuth && (window.session.user.isSuperUser || window.session.user.isStaff) &&
    //             model.get('can_modify')) {
    //
    //             defaultLayout.showChildView('bottom', new DescriptorGroupTypeAddView({collection: collection}));
    //         }
    //     });
    //
    //     collection.fetch().then(function () {
    //         let descriptorTypeListView = new DescriptorTypeListView({collection : collection});
    //
    //         defaultLayout.showChildView('content', descriptorTypeListView);
    //         defaultLayout.showChildView('content-bottom', new ScrollingMoreView({targetView: descriptorTypeListView}));
    //     });
    // },
    //
    // getDescriptorTypeForGroup : function(gid, tid) {
    //     let defaultLayout = new DefaultLayout();
    //     application.main.showContent(defaultLayout);
    //
    //     let model = new DescriptorTypeModel({id: tid}, {group_id: gid});
    //
    //     model.fetch().then(function () {
    //         defaultLayout.showChildView('title', new TitleView({title: _t("Details for the type of descriptor"), model: model}));
    //         defaultLayout.showChildView('content', new DescriptorTypeDetailsLayout({model: model}));
    //     });
    // },
    //
    // getDescriptorValueListForType : function(gid, tid) {
    //     let collection = new DescriptorValueCollection([], {group_id: gid, type_id: tid});
    //
    //     let defaultLayout = new DefaultLayout();
    //     application.main.showContent(defaultLayout);
    //
    //     let model = new DescriptorTypeModel({id: tid}, {group_id: gid});
    //     model.fetch().then(function () {
    //         defaultLayout.showChildView('title', new TitleView({title: _t("Values for the type of descriptor"), model: model}));
    //
    //         collection.fetch().then(function () {
    //             let valueListView = null;
    //
    //             if (model.get('format').type === "enum_single") {
    //                 valueListView = new DescriptorValueListView({
    //                     collection: collection,
    //                     model: model
    //                 });
    //
    //                 // @todo lookup for permission
    //                 if (session.user.isAuth && (session.user.isSuperUser || session.user.isStaff) && model.get('can_modify')) {
    //                     defaultLayout.showChildView('bottom', new DescriptorValueAddView({collection: collection}));
    //                 }
    //             } else if (model.get('format').type === "enum_pair") {
    //                 valueListView = new DescriptorValuePairListView({
    //                     collection: collection,
    //                     model: model
    //                 });
    //
    //                 // @todo lookup for permission
    //                 if (session.user.isAuth && (session.user.isSuperUser || session.user.isStaff) && model.get('can_modify')) {
    //                     defaultLayout.showChildView('bottom', new DescriptorValueAddView({collection: collection}));
    //                 }
    //             } else if (model.get('format').type === "enum_ordinal") {
    //                 valueListView = new DescriptorValueOrdinalListView({
    //                     collection: collection,
    //                     model: model
    //                 });
    //             }
    //
    //             if (valueListView) {
    //                 defaultLayout.showChildView('content', valueListView);
    //                 defaultLayout.showChildView('content-bottom', new ScrollingMoreView({targetView: valueListView, more: -1}));
    //             }
    //         });
    //     });
    // }
});

module.exports = Router;
