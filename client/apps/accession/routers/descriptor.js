/**
 * @file descriptor.js
 * @brief Descriptor router
 * @author Frederic SCHERMA
 * @date 2016-07-19
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var DescpritorGroupModel = require('../models/descriptorgroup');
var DescpritorTypeModel = require('../models/descriptortype');
var DescpritorValueModel = require('../models/descriptorvalue');
var DescriptorGroupCollection = require('../collections/descriptorgroup');
var DescriptorTypeCollection = require('../collections/descriptortype');
var DescriptorValueCollection = require('../collections/descriptorvalue');
var DescriptorGroupListView = require('../views/descriptorgrouplist');
var DescriptorTypeListView = require('../views/descriptortypelist');
var DescriptorValueListView = require('../views/descriptorvaluelist');
var DescriptorTypeItemView = require('../views/descriptortype');
var DescriptorValueItemView = require('../views/descriptorvalue');
var DefaultLayout = require('../../main/views/defaultlayout');
var TitleView = require('../../main/views/titleview');

var Router = Marionette.AppRouter.extend({
    routes : {
        "app/accession/descriptor/group/": "getDescriptorGroupList",
        // "app/accession/descriptor/group/:id/": "getDescriptorGroup", only POST here
        "app/accession/descriptor/group/:id/type/": "getDescriptorTypeListForGroup",
        "app/accession/descriptor/group/:id/type/:id/value/": "getDescriptorValueListForType",
        "app/accession/descriptor/group/:id/type/:id/value/:id": "getDescriptorValueForType"
    },

    getDescriptorGroupList : function() {
        var collection = ohgr.accession.collections.descriptorGroup;

        var defaultLayout = new DefaultLayout({});
        ohgr.mainRegion.show(defaultLayout);

        defaultLayout.title.show(new TitleView({title: gt.gettext("List of groups of descriptors")}));

        collection.fetch().then(function () {
            defaultLayout.content.show(new DescriptorGroupListView({read_only: true, collection : collection}));
        });
    },

    getDescriptorTypeListForGroup : function(id) {
        var collection = new DescriptorTypeCollection([], {group_id: id});

        var defaultLayout = new DefaultLayout();
        ohgr.mainRegion.show(defaultLayout);

        var model = new DescpritorGroupModel({id: id});
        model.fetch().then(function () {
            defaultLayout.title.show(new TitleView({title: gt.gettext("Types of descriptors for the group"), object: model.get('name')}));
        });

        collection.fetch().then(function () {
            defaultLayout.content.show(new DescriptorTypeListView({read_only: true, collection : collection}));
        });
    },

    getDescriptorValueListForType : function(gid, tid) {
        var collection = new DescriptorValueCollection([], {group_id: gid, type_id: tid});

        var defaultLayout = new DefaultLayout();
        ohgr.mainRegion.show(defaultLayout);

        var model = new DescpritorTypeModel({group_id: gid, id: tid});
        model.fetch({id: gid}).then(function () {
            defaultLayout.title.show(new TitleView({title: gt.gettext("Values for the type of descriptor"), object: model.get('name')}));
        });

        defaultLayout.title.show(new TitleView({title: gt.gettext("Values for the descriptor")}));

        collection.fetch().then(function () {
            defaultLayout.content.show(new DescriptorValueListView({read_only: true, collection : collection}));
        });
    },

    /*getDescriptorValueForType: function (gid, tid, id) {
        alert(gid); alert(tid);
    }*/
});

module.exports = Router;
