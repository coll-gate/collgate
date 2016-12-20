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

var TaxonModel = require('../../taxonomy/models/taxon');
var AccessionModel = require('../models/accession');
// var BatchModel = require('../models/batch');

var AccessionCollection = require('../collections/accession');
// var BatchCollection = require('../collections/batch');

var TaxonSimpleView = require('../../taxonomy/views/taxonsimple');
var AccessionListView = require('../views/accessionlist');
// var BatchListView = require('../views/batchlist');
// var AccessionItemView = require('../views/accessionitem');
// var BatchItemView = require('../views/batchitem');
var AccessionEditView = require('../views/accessionedit');
var AccessionDetailsView = require('../views/accessiondetails');

var DefaultLayout = require('../../main/views/defaultlayout');
var ScrollingMoreView = require('../../main/views/scrollingmore');
var TitleView = require('../../main/views/titleview');
var DescribableLayout = require('../../descriptor/views/describablelayout');

var Router = Marionette.AppRouter.extend({
    routes : {
        "app/accession/accession/": "getAccessionList",
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
            var accessionListView = new AccessionListView({collection : collection});

            defaultLayout.getRegion('content').show(accessionListView);
            defaultLayout.getRegion('content-bottom').show(new ScrollingMoreView({targetView: accessionListView}));
        });
    },

    getAccession : function(id) {
        var defaultLayout = new DefaultLayout();
        application.getRegion('mainRegion').show(defaultLayout);

        var describableLayout = new DescribableLayout();
        defaultLayout.getRegion('content').show(describableLayout);

        var model = new AccessionModel({id: id});
        model.fetch().then(function() {
            var taxon = new TaxonModel({id: model.get('parent')['id']});
            taxon.fetch().then(function() {
                describableLayout.getRegion('header').show(new TaxonSimpleView({model: taxon, entity: model}));
            });

            defaultLayout.getRegion('title').show(new TitleView({title: gt.gettext("Accession"), model: model}));

            // get the layout before creating the view
            $.ajax({
                method: "GET",
                url: application.baseUrl + 'descriptor/meta-model/' + model.get('descriptor_meta_model') + '/layout/',
                dataType: 'json',
            }).done(function(data) {
                var accessionDetailsView = new AccessionDetailsView({model: model, descriptorMetaModelLayout: data});
                describableLayout.getRegion('body').show(accessionDetailsView);
            });
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
