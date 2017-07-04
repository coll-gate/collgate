/**
 * @file taxon.js
 * @brief Taxon router
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-04-13
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Marionette = require('backbone.marionette');
var TaxonModel = require('../models/taxon');

var TaxonListView = require('../views/taxonlist');
var TaxonListFilterView = require('../views/taxonlistfilter');
var CultivarListView = require('../views/cultivarlist');
var CultivarListFilterView = require('../views/cultivarlistfilter');

var TaxonLayout = require('../views/taxonlayout');

var DefaultLayout = require('../../main/views/defaultlayout');
var TitleView = require('../../main/views/titleview');
var ScrollingMoreView = require('../../main/views/scrollingmore');

var TaxonCollection = require('../collections/taxon');
var CultivarCollection = require('../collections/cultivar');


var TaxonRouter = Marionette.AppRouter.extend({
    routes : {
        "app/classification/taxon/": "getTaxonList",
        "app/classification/cultivar/": "getCultivarList",
        "app/classification/taxon/:id/*tab": "getTaxon"
    },
/*
    constructor: function() {
        var args = Array.prototype.slice.call(arguments);
        Marionette.AppRouter.apply(this, args);

        // set up the onRoute processing, from the existing route event
        this.on("route", this._processOnRoute, this);
    },

    // process the route event and trigger the onRoute method call, if it exists
    _processOnRoute: function(routeName, routeArgs) {
        // find the path that matched
        var routePath = _.invert(this.appRoutes)[routeName];

        // make sure an onRoute is there, and call it
        if (_.isFunction(this.onRoute)) {
            this.onRoute(routeName, routePath, routeArgs);
        }
    },

    onRoute: function(route, name, args) {
        console.log('route');
    },
*/
    getTaxonList : function() {
        var collection = application.classification.collections.taxons;

        var defaultLayout = new DefaultLayout({});
        application.show(defaultLayout);

        defaultLayout.getRegion('title').show(new TitleView({title: gt.gettext("List of taxons")}));

        // get available columns
        var columns = $.ajax({
            type: "GET",
            url: application.baseUrl + 'descriptor/columns/classification.taxon/',
            contentType: "application/json; charset=utf-8"
        });

        $.when(columns, collection.fetch()).done(function (data) {
            var taxonListView = new TaxonListView({collection : collection, columns: data[0].columns});

            defaultLayout.getRegion('content').show(taxonListView);
            defaultLayout.getRegion('content-bottom').show(new ScrollingMoreView({
                targetView: taxonListView,
                collection: collection
            }));

            defaultLayout.getRegion('bottom').show(new TaxonListFilterView({
                collection: collection, columns: data[0].columns}));
        });
    },

    getCultivarList : function() {
        var collection = new CultivarCollection();

        var defaultLayout = new DefaultLayout({});
        application.show(defaultLayout);

        defaultLayout.getRegion('title').show(new TitleView({title: gt.gettext("List of cultivars")}));

        collection.fetch().then(function () {
            var taxonListView = new CultivarListView({collection : collection});

            defaultLayout.getRegion('content').show(taxonListView);
            defaultLayout.getRegion('content-bottom').show(new ScrollingMoreView({
                targetView: taxonListView,
                collection: collection
            }));
        });

        defaultLayout.getRegion('bottom').show(new CultivarListFilterView({collection: collection}));
    },

    getTaxon : function(id, tab) {
        tab || (tab = "");

        var taxon = new TaxonModel({id: id});

        var defaultLayout = new DefaultLayout();
        application.show(defaultLayout);

        var taxonLayout = new TaxonLayout({model: taxon, initialTab: tab.replace('/', '')});

        taxon.fetch().then(function () {
            defaultLayout.getRegion('title').show(new TitleView({title: gt.gettext("Taxon details"), model: taxon}));
            defaultLayout.getRegion('content').show(taxonLayout);
        });

        taxon.fetch();
    }
});

module.exports = TaxonRouter;
