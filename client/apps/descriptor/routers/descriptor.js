/**
 * @file descriptor.js
 * @brief Descriptor router
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-07-19
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Marionette = require('backbone.marionette');
var DescriptorGroupModel = require('../models/descriptorgroup');
var DescriptorTypeModel = require('../models/descriptortype');
var DescriptorTypeCollection = require('../collections/descriptortype');
var DescriptorValueCollection = require('../collections/descriptorvalue');
var DescriptorGroupListView = require('../views/descriptorgrouplist');
var DescriptorTypeListView = require('../views/descriptortypelist');

var DescriptorValueListView = require('../views/descriptorvaluelist');
var DescriptorValuePairListView = require('../views/descriptorvaluepairlist');
var DescriptorValueOrdinalListView = require('../views/descriptorvalueordinallist');
var DescriptorValueAddView = require('../views/descriptorvalueadd');

var DescriptorTypeDetailsLayout = require('../views/descriptortypedetailslayout');
var DefaultLayout = require('../../main/views/defaultlayout');
var TitleView = require('../../main/views/titleview');
var ScrollingMoreView = require('../../main/views/scrollingmore');

var DescriptorGroupAddView = require('../views/descriptorgroupadd');
var DescriptorGroupTypeAddView = require('../views/descriptorgrouptypeadd');

var Router = Marionette.AppRouter.extend({
    routes : {
        "app/descriptor/group/": "getDescriptorGroupList",
        "app/descriptor/group/:id/type/": "getDescriptorTypeListForGroup",
        "app/descriptor/group/:id/type/:id/": "getDescriptorTypeForGroup",
        "app/descriptor/group/:id/type/:id/value/": "getDescriptorValueListForType",
        "app/descriptor/group/:id/type/:id/value/:id": "getDescriptorValueForType"
    },

    getDescriptorGroupList : function() {
        var collection = application.descriptor.collections.descriptorGroup;

        var defaultLayout = new DefaultLayout({});
        application.main.showContent(defaultLayout);

        defaultLayout.showChildView('title', new TitleView({title: gt.gettext("List of groups of descriptors")}));

        collection.fetch().then(function () {
            var descriptorGroupListView = new DescriptorGroupListView({read_only: true, collection: collection});
            defaultLayout.showChildView('content', descriptorGroupListView);
            defaultLayout.showChildView('content-bottom', new ScrollingMoreView({targetView: descriptorGroupListView}));
        });

        // @todo lookup for permission
        if (session.user.isAuth && (session.user.isSuperUser || session.user.isStaff)) {
            defaultLayout.showChildView('bottom', new DescriptorGroupAddView({collection: collection}));
        }
    },

    getDescriptorTypeListForGroup : function(id) {
        var collection = new DescriptorTypeCollection([], {group_id: id});

        var defaultLayout = new DefaultLayout();
        application.main.showContent(defaultLayout);

        var model = new DescriptorGroupModel({id: id});
        model.fetch().then(function () {
            defaultLayout.showChildView('title', new TitleView({title: gt.gettext("Types of descriptors for the group"), model: model}));

            // @todo lookup for permission
            if (session.user.isAuth && (session.user.isSuperUser || session.user.isStaff) && model.get('can_modify')) {
                defaultLayout.showChildView('bottom', new DescriptorGroupTypeAddView({collection: collection}));
            }
        });

        collection.fetch().then(function () {
            var descriptorTypeListView = new DescriptorTypeListView({collection : collection});

            defaultLayout.showChildView('content', descriptorTypeListView);
            defaultLayout.showChildView('content-bottom', new ScrollingMoreView({targetView: descriptorTypeListView}));
        });
    },

    getDescriptorTypeForGroup : function(gid, tid) {
        var defaultLayout = new DefaultLayout();
        application.main.showContent(defaultLayout);

        var model = new DescriptorTypeModel({id: tid}, {group_id: gid});

        model.fetch().then(function () {
            defaultLayout.showChildView('title', new TitleView({title: gt.gettext("Details for the type of descriptor"), model: model}));
            defaultLayout.showChildView('content', new DescriptorTypeDetailsLayout({model: model}));
        });
    },

    getDescriptorValueListForType : function(gid, tid) {
        var collection = new DescriptorValueCollection([], {group_id: gid, type_id: tid});

        var defaultLayout = new DefaultLayout();
        application.main.showContent(defaultLayout);

        var model = new DescriptorTypeModel({id: tid}, {group_id: gid});
        model.fetch().then(function () {
            defaultLayout.showChildView('title', new TitleView({title: gt.gettext("Values for the type of descriptor"), model: model}));

            collection.fetch().then(function () {
                var valueListView = null;

                if (model.get('format').type === "enum_single") {
                    valueListView = new DescriptorValueListView({
                        collection: collection,
                        model: model
                    });

                    // @todo lookup for permission
                    if (session.user.isAuth && (session.user.isSuperUser || session.user.isStaff) && model.get('can_modify')) {
                        defaultLayout.showChildView('bottom', new DescriptorValueAddView({collection: collection}));
                    }
                } else if (model.get('format').type === "enum_pair") {
                    valueListView = new DescriptorValuePairListView({
                        collection: collection,
                        model: model
                    });

                    // @todo lookup for permission
                    if (session.user.isAuth && (session.user.isSuperUser || session.user.isStaff) && model.get('can_modify')) {
                        defaultLayout.showChildView('bottom', new DescriptorValueAddView({collection: collection}));
                    }
                } else if (model.get('format').type === "enum_ordinal") {
                    valueListView = new DescriptorValueOrdinalListView({
                        collection: collection,
                        model: model
                    });
                }

                if (valueListView != null) {
                    defaultLayout.showChildView('content', valueListView);
                    defaultLayout.showChildView('content-bottom', new ScrollingMoreView({targetView: valueListView, more: -1}));
                }
            });
        });
    }
});

module.exports = Router;
