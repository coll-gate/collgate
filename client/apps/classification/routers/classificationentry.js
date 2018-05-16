/**
 * @file classificationentry.js
 * @brief Classification entry router
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-04-13
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let Marionette = require('backbone.marionette');

let ClassificationModel = require('../models/classification');
let ClassificationEntryModel = require('../models/classificationentry');

let ClassificationEntryListView = require('../views/classificationentrylist');
let EntityListFilterView = require('../../descriptor/views/entitylistfilter');

let ClassificationEntryLayout = require('../views/classificationentrylayout');

let DefaultLayout = require('../../main/views/defaultlayout');
let TitleView = require('../../main/views/titleview');
let ScrollingMoreView = require('../../main/views/scrollingmore');

let ClassificationEntryCollection = require('../collections/classificationentry');


let ClassificationEntryRouter = Marionette.AppRouter.extend({
    routes : {
        "app/classification/classificationentry/:id/*tab": "getClassificationEntry",
        "app/classification/classification/:id/classificationentry/": "getClassificationClassificationEntry"
    },
/*
    constructor: function() {
        let args = Array.prototype.slice.call(arguments);
        Marionette.AppRouter.apply(this, args);

        // set up the onRoute processing, from the existing route event
        this.on("route", this._processOnRoute, this);
    },

    // process the route event and trigger the onRoute method call, if it exists
    _processOnRoute: function(routeName, routeArgs) {
        // find the path that matched
        let routePath = _.invert(this.appRoutes)[routeName];

        // make sure an onRoute is there, and call it
        if (_.isFunction(this.onRoute)) {
            this.onRoute(routeName, routePath, routeArgs);
        }
    },

    onRoute: function(route, name, args) {
        console.log('route');
    },
*/
    getClassificationEntry : function(id, tab) {
        tab || (tab = "");

        let classificationEntry = new ClassificationEntryModel({id: id});

        let defaultLayout = new DefaultLayout();
        window.application.main.showContent(defaultLayout);

        let classificationEntryLayout = new ClassificationEntryLayout({model: classificationEntry, initialTab: tab.replace('/', '')});

        classificationEntry.fetch().then(function () {
            defaultLayout.showChildView('title', new TitleView({title: _t("Classification entry details"), model: classificationEntry}));
            defaultLayout.showChildView('content', classificationEntryLayout);
        });
    },

    getClassificationClassificationEntry: function(id) {
        let classification = new ClassificationModel({id: id});

        let defaultLayout = new DefaultLayout();
        window.application.main.showContent(defaultLayout);

        let collection = new ClassificationEntryCollection([], {classification_id: id});

        // get available columns
        let columns = window.application.main.cache.lookup({
            type: 'entity_columns',
            format: {model: 'classification.classificationentry'}
        });

        $.when(columns, classification.fetch()).then(function(data) {
            defaultLayout.showChildView('title', new TitleView({
                title: _t("Classifications entries"),
                model: classification
            }));

            let classificationEntryListView = new ClassificationEntryListView({
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

            // to force display of the context menu
            classificationEntryListView.onShowTab();
        });
    }
});

module.exports = ClassificationEntryRouter;
