/**
 * @file classificationentry.js
 * @brief Classification entry router
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-04-13
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Marionette = require('backbone.marionette');

var ClassificationModel = require('../models/classification');
var ClassificationEntryModel = require('../models/classificationentry');

var ClassificationEntryListView = require('../views/classificationentrylist');
var EntityListFilterView = require('../../descriptor/views/entitylistfilter');

var ClassificationEntryLayout = require('../views/classificationentrylayout');

var DefaultLayout = require('../../main/views/defaultlayout');
var TitleView = require('../../main/views/titleview');
var ScrollingMoreView = require('../../main/views/scrollingmore');

var ClassificationEntryCollection = require('../collections/classificationentry');


var ClassificationEntryRouter = Marionette.AppRouter.extend({
    routes : {
        "app/classification/classificationentry/": "getClassificationEntryList",
        "app/classification/classificationentry/:id/*tab": "getClassificationEntry",
        "app/classification/classification/:id/classificationentry/": "getClassificationClassificationEntry"
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
    getClassificationEntryList : function() {
        var collection = new ClassificationEntryCollection();

        var defaultLayout = new DefaultLayout({});
        application.main.showContent(defaultLayout);

        defaultLayout.showChildView('title', new TitleView({title: _t("List of classifications entries")}));

        // get available columns
        var columns = application.main.cache.lookup({
            type: 'entity_columns',
            format: {model: 'classification.classificationentry'}
        });

        columns.done(function(data) {
            if (!defaultLayout.isRendered()) {
                return;
            }

            var classificationEntryListView = new ClassificationEntryListView({
                collection : collection, columns: data[0].value});

            defaultLayout.showChildView('content', classificationEntryListView);
            defaultLayout.showChildView('content-bottom', new ScrollingMoreView({
                targetView: classificationEntryListView,
                collection: collection
            }));

            defaultLayout.showChildView('bottom', new EntityListFilterView({
                collection: collection, columns: data[0].value}));

            classificationEntryListView.query();
        });
    },

    getClassificationEntry : function(id, tab) {
        tab || (tab = "");

        var classificationEntry = new ClassificationEntryModel({id: id});

        var defaultLayout = new DefaultLayout();
        application.main.showContent(defaultLayout);

        var classificationEntryLayout = new ClassificationEntryLayout({model: classificationEntry, initialTab: tab.replace('/', '')});

        classificationEntry.fetch().then(function () {
            defaultLayout.showChildView('title', new TitleView({title: _t("Classification entry details"), model: classificationEntry}));
            defaultLayout.showChildView('content', classificationEntryLayout);
        });

        classificationEntry.fetch();
    },

    getClassificationClassificationEntry: function(id) {
        var classification = new ClassificationModel({id: id});

        var defaultLayout = new DefaultLayout();
        application.main.showContent(defaultLayout);

        var collection = new ClassificationEntryCollection([], {classification_id: id});

        // get available columns
        var columns = application.main.cache.lookup({
            type: 'entity_columns',
            format: {model: 'classification.classificationentry'}
        });

        $.when(columns, classification.fetch()).then(function(data) {
            defaultLayout.showChildView('title', new TitleView({
                title: _t("Classifications entries"),
                model: classification
            }));

            var classificationEntryListView = new ClassificationEntryListView({
                classification: classification,
                collection: collection,
                columns: data[0].value
            });

            defaultLayout.showChildView('content', classificationEntryListView);
            defaultLayout.showChildView('content-bottom', new ScrollingMoreView({
                targetView: classificationEntryListView,
                collection: collection
            }));

            // need classification permission details
            classificationEntryListView.query();

            defaultLayout.showChildView('bottom', new EntityListFilterView({
                collection: collection, columns: data[0].value}));
        });
    }
});

module.exports = ClassificationEntryRouter;
