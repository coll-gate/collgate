/**
 * @file accession.js
 * @brief Accession router
 * @author Frederic SCHERMA
 * @date 2016-07-19
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var AccessionModel = require('../models/accession');
// var BatchModel = require('../models/batch');

var AccessionCollection = require('../collections/accession');
// var BatchCollection = require('../collections/batch');

var AccessionListView = require('../views/accessionlist');
// var BatchListView = require('../views/batchlist');
// var AccessionItemView = require('../views/accessionitem');
// var BatchItemView = require('../views/batchitem');
var AccessionEditView = require('../views/accessionedit');

var DefaultLayout = require('../../main/views/defaultlayout');
var TitleView = require('../../main/views/titleview');
var DescribableLayout = require('../../descriptor/views/describablelayout');

var Router = Marionette.AppRouter.extend({
    routes : {
        "app/accession/accession/": "getAccessionList",
        "app/accession/accession/create/:meta_model_id/": "getAccessionCreate",
        "app/accession/accession/:id/": "getAccession",
        "app/accession/accession/:id/batch/": "getBatchList",
        "app/accession/accession/:id/batch/:bid": "getBatch",
        "app/accession/accession/:id/batch/:bid/sample/": "getSampleList",
        "app/accession/accession/:id/batch/:bid/sample/:sid/": "getSample",
    },

    getAccessionList : function() {
        var collection = new AccessionCollection();

        var defaultLayout = new DefaultLayout({});
        application.getRegion('mainRegion').show(defaultLayout);

        defaultLayout.getRegion('title').show(new TitleView({title: gt.gettext("List of accessions")}));

        collection.fetch().then(function () {
            defaultLayout.getRegion('content').show(new AccessionListView({collection : collection}));
        });
    },

    getAccessionCreate: function(meta_model_id) {
        var model = application.accession.tmpAccession;
        delete application.accession.tmpAccession;

        var defaultLayout = new DefaultLayout();
        application.getRegion('mainRegion').show(defaultLayout);

        if (model == null) {
            return;
        }

        model.fetch({data:{name: model.get('name'), parent: model.get('parent')}}).then(function() {
            defaultLayout.getRegion('title').show(new TitleView({title: gt.gettext("Accession"), model: model}));

            var view = new AccessionEditView({model: model});
            defaultLayout.getRegion('content').show(view);
        });
    },

    getAccession : function(id) {
        var defaultLayout = new DefaultLayout();
        application.getRegion('mainRegion').show(defaultLayout);

        var model = new AccessionModel({id: id});
        model.fetch().then(function() {
            defaultLayout.getRegion('title').show(new TitleView({title: gt.gettext("Accession"), model: model}));

            alert('@todo');
        });
    },

    getBatchList : function(id) {
        alert("Not yet implemented");
    },

    getBatch : function(id) {
        alert("Not yet implemented");
    },

    getSampleList : function(id) {
        alert("Not yet implemented");
    },

    getSample : function(id) {
        alert("Not yet implemented");
    },
});

module.exports = Router;
