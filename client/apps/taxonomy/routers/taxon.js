/**
 * @file taxon.js
 * @brief Taxon router
 * @author Frederic SCHERMA
 * @date 2016-04-13
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var TaxonModel = require('../models/taxon');

var TaxonListView = require('../views/taxonlist');
var TaxonListFilterView = require('../views/taxonlistfilter');

var TaxonLayout = require('../views/taxonlayout');

var DefaultLayout = require('../../main/views/defaultlayout');
var TitleView = require('../../main/views/titleview');
var ScrollingMoreView = require('../../main/views/scrollingmore');

var TaxonRouter = Marionette.AppRouter.extend({
    routes : {
        "app/taxonomy/taxon/": "getTaxonList",
        "app/taxonomy/taxon/:id/": "getTaxon"
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
        var collection = application.taxonomy.collections.taxons;

        var defaultLayout = new DefaultLayout({});
        application.show(defaultLayout);

        defaultLayout.getRegion('title').show(new TitleView({title: gt.gettext("List of taxons")}));

        collection.fetch().then(function () {
            var taxonListView = new TaxonListView({collection : collection});

            defaultLayout.getRegion('content').show(taxonListView);
            defaultLayout.getRegion('content-bottom').show(new ScrollingMoreView({targetView: taxonListView}));
        });

        defaultLayout.getRegion('bottom').show(new TaxonListFilterView({collection: collection}));
    },

    getTaxon : function(id) {
        var taxon = new TaxonModel({id: id});

        var defaultLayout = new DefaultLayout();
        application.show(defaultLayout);

        var taxonLayout = new TaxonLayout({model: taxon});

        taxon.fetch().then(function () {
            defaultLayout.getRegion('title').show(new TitleView({title: gt.gettext("Taxon details"), model: taxon}));
            defaultLayout.getRegion('content').show(taxonLayout);
        });

        taxon.fetch();
    }
});

module.exports = TaxonRouter;
