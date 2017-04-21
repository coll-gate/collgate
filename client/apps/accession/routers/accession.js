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
var AccessionCollection = require('../collections/accession');
var AccessionListView = require('../views/accessionlist');
var AccessionListFooterView = require('../views/accessionlistfooter');

var DefaultLayout = require('../../main/views/defaultlayout');
var ScrollingMoreView = require('../../main/views/scrollingmore');
var TitleView = require('../../main/views/titleview');
var AccessionLayout = require('../views/accessionlayout');

var Router = Marionette.AppRouter.extend({
    routes : {
        "app/accession/accession/": "getAccessionList",
        "app/accession/accession/:id/*tab": "getAccession"
    },

    getAccessionList : function() {
        var collection = new AccessionCollection();

        var defaultLayout = new DefaultLayout({});
        application.show(defaultLayout);

        defaultLayout.getRegion('title').show(new TitleView({title: gt.gettext("List of accessions")}));

        // get available columns
        var columns = $.ajax({
            type: "GET",
            url: application.baseUrl + 'descriptor/columns/accession.accession/',
            contentType: "application/json; charset=utf-8"
        });
        
        $.when(columns, collection.fetch()).done(function (data) {
            var accessionListView = new AccessionListView({collection : collection, columns: data[0].columns});

            defaultLayout.getRegion('content').show(accessionListView);
            defaultLayout.getRegion('content-bottom').show(new ScrollingMoreView({targetView: accessionListView}));
        });

        defaultLayout.getRegion('bottom').show(new AccessionListFooterView({collection: collection}));
    },

    getAccession : function(id, tab) {
        tab || (tab = "");

        var accession = new AccessionModel({id: id});

        var defaultLayout = new DefaultLayout();
        application.show(defaultLayout);

        accession.fetch().then(function() {
            defaultLayout.getRegion('title').show(new TitleView({title: gt.gettext("Accession"), model: accession}));

            var accessionLayout = new AccessionLayout({model: accession, initialTab: tab.replace('/', '')});
            defaultLayout.getRegion('content').show(accessionLayout);
        });
    }
});

module.exports = Router;
