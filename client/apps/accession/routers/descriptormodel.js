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
var DescriptorModelCollection = require('../collections/descriptormodel');
var DescriptorModelListView = require('../collections/descriptormodel');
var DescriptorModelAddView = require('../views/descriptormodeladd');
var DescriptorModelListView = require('../views/descriptormodellist');
var DefaultLayout = require('../../main/views/defaultlayout');
var TitleView = require('../../main/views/titleview');
var ScrollingMoreView = require('../../main/views/scrollingmore');

var Router = Marionette.AppRouter.extend({
    routes : {
        "app/accession/descriptor/model/": "getDescriptorModelList",
        "app/accession/descriptor/model/:id/": "getDescriptorModel",
        //"app/accession/descriptor/model/:id/panel/": "getDescriptorPanelListForModel",
        //"app/accession/descriptor/model/:id/panel/:panel_id/": "getDescriptorPanelForModel",
        "app/accession/descriptor/model/:id/type/": "getDescriptorModelTypeListForModel",
        "app/accession/descriptor/model/:id/type/:type_id/": "getDescriptorModelTypePanelForModel",
    },

    getDescriptorModelList: function () {
        var collection = new DescriptorModelCollection();

        var defaultLayout = new DefaultLayout({});
        application.mainRegion.show(defaultLayout);

        defaultLayout.title.show(new TitleView({title: gt.gettext("List of models of descriptors")}));

        collection.fetch().then(function () {
            defaultLayout.content.show(new DescriptorModelListView({collection : collection}));
        });

        // TODO lookup for permission
        if (session.user.isAuth && (session.user.isSuperUser || session.user.isStaff)) {
            defaultLayout.bottom.show(new DescriptorModelAddView({collection: collection}));
        }
    },

    getDescriptorModel: function (id) {
        alert(id);
    },

    getDescriptorPanelListForModel: function (id) {
        alert(id);
    },

    getDescriptorPanelForModel: function (id, panelId) {
        alert(id, panelId);
    },

    getDescriptorModelTypeListForModel: function(id) {

    },

    getDescriptorModelTypePanelForModel: function (id, typeId) {
        alert(id, typeId);
    }
});

module.exports = Router;
