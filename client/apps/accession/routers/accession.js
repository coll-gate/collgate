/**
 * @file accession.js
 * @brief Accession router
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-07-19
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
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

    getAccessionList : function(options) {
        options || (options = {});

        var collection = new AccessionCollection({
            filters: (options.filters || {}),
            search: (options.search || {})
        });

        var defaultLayout = new DefaultLayout({});
        application.main.showContent(defaultLayout);

        defaultLayout.showChildView('title', new TitleView({title: gt.gettext("List of accessions")}));

        // get available columns
        var columns = $.ajax({
            type: "GET",
            url: application.baseUrl + 'descriptor/columns/accession.accession/',
            contentType: "application/json; charset=utf-8"
        });

        columns.done(function (data) {
            var accessionListView = new AccessionListView({collection : collection, columns: data.columns});

            defaultLayout.showChildView('content', accessionListView);
            defaultLayout.showChildView('content-bottom', new ScrollingMoreView({
                collection: collection,
                targetView: accessionListView
            }));

            defaultLayout.showChildView('bottom', new AccessionListFooterView({
                collection: collection, columns: data.columns}));

            accessionListView.query();
        });
    },

    getAccession : function(id, tab) {
        tab || (tab = "");

        var accession = new AccessionModel({id: id});

        var defaultLayout = new DefaultLayout();
        application.main.showContent(defaultLayout);

        accession.fetch().then(function() {
            defaultLayout.showChildView('title', new TitleView({title: gt.gettext("Accession"), model: accession}));

            var accessionLayout = new AccessionLayout({model: accession, initialTab: tab.replace('/', '')});
            defaultLayout.showChildView('content', accessionLayout);
        });
    }
});

module.exports = Router;
