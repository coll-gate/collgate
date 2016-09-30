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
var DescriptorModelListView = require('../collections/descriptormodel');
var DescriptorModelAddView = require('../views/descriptormodeladd');
var DescriptorModelDetailView = require('../views/descriptormodeldetail');
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
        application.getRegion('mainRegion').show(defaultLayout);

        defaultLayout.getRegion('title').show(new TitleView({title: gt.gettext("List of models of descriptors")}));

        collection.fetch().then(function () {
            defaultLayout.getRegion('content').show(new DescriptorModelListView({collection : collection}));
        });

        // TODO lookup for permission
        if (session.user.isAuth && (session.user.isSuperUser || session.user.isStaff)) {
            defaultLayout.getRegion('bottom').show(new DescriptorModelAddView({collection: collection}));
        }
    },

    getDescriptorModel: function (id) {
        var defaultLayout = new DefaultLayout();
        application.getRegion('mainRegion').show(defaultLayout);

        var model = new DescriptorModelModel({id: id});

        model.fetch().then(function () {
            defaultLayout.getRegion('title').show(new TitleView({title: gt.gettext("Details for the model of descriptor"), object: model.get('name')}));
            defaultLayout.getRegion('content').show(new DescriptorModelDetailView({model : model}));
        });
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
