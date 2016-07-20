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
var DescriptorGroupCollection = require('../collections/descriptorgroup');
var DescriptorTypeCollection = require('../collections/descriptortype');
var DescriptorGroupListView = require('../views/descriptorgrouplist');
var DescriptorTypeListView = require('../views/descriptortypelist');
var DescritporTypeItemView = require('../views/descriptortype');
var DefaultLayout = require('../../main/views/defaultlayout');
var TitleView = require('../../main/views/titleview');

var Router = Marionette.AppRouter.extend({
    routes : {
        "app/accession/descriptor/group/": "getDescriptorGroupList",
        // "app/accession/descriptor/group/:id/": "getDescriptorGroup", only POST here
        "app/accession/descriptor/group/:id/type/": "getDescriptorTypeListForGroup",
        "app/accession/descriptor/group/:id/type/:id/": "getDescriptorTypeForGroup",
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
        var collection = new DescriptorTypeCollection({id: id});

        var defaultLayout = new DefaultLayout();
        ohgr.mainRegion.show(defaultLayout);

        defaultLayout.title.show(new TitleView({title: gt.gettext("Types of descriptors for the group")}));

        collection.fetch().then(function () {
            defaultLayout.content.show(new DescriptorTypeListView({read_only: true, collection : collection}));
        });
    },

    getDescriptorTypeForGroup : function(id) {
        alert("Not yet implemented");
    },    
});

module.exports = Router;
