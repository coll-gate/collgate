/**
 * @file stocklocation.js
 * @brief stock location router
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2018-03-29
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');

// let AccessionModel = require('../models/accession');
// let AccessionCollection = require('../collections/accession');
// let AccessionListView = require('../views/accession/accessionlist');
// let EntityListFilterView = require('../../descriptor/views/entitylistfilter');

let test = require([
    'jquery',
    'jquery.fancytree/dist/modules/jquery.fancytree',
    'jquery.fancytree/dist/modules/jquery.fancytree.filter'
]);

let DefaultLayout = require('../../main/views/defaultlayout');
// let ScrollingMoreView = require('../../main/views/scrollingmore');
let TitleView = require('../../main/views/titleview');
let StockLocationList = require('../views/stocklocation/stocklocationlist');
// let AccessionLayout = require('../views/accession/accessionlayout');

let Router = Marionette.AppRouter.extend({
    routes: {
        "app/accession/stocklocation/": "getStockLocationsOverview",
        // "app/accession/stocklocation/:id/*tab": "getStockLocation"
    },

    getStockLocationsOverview: function (options) {
        options || (options = {});

        let defaultLayout = new DefaultLayout({});
        window.application.main.showContent(defaultLayout);

        let stocklocation = new StockLocationList({

        });

        defaultLayout.showChildView('title', new TitleView({title: _t("Stock locations")}));
        defaultLayout.showChildView('content', stocklocation);


        // let collection = new AccessionCollection([], {
        //     filters: (options.filters || {}),
        //     search: (options.search || {})
        // });
        //
        // let defaultLayout = new DefaultLayout({});
        // window.application.main.showContent(defaultLayout);
        //
        // defaultLayout.showChildView('title', new TitleView({title: _t("Stock locations")}));
        //
        // // get available columns
        // let columns = window.application.main.cache.lookup({
        //     type: 'entity_columns',
        //     format: {model: 'accession.accession'}
        // });
        //
        // columns.done(function (data) {
        //     let accessionListView = new AccessionListView({
        //         collection : collection, columns: data[0].value,
        //         onRender: function () {
        //             this.onShowTab();
        //         }
        //     });
        //
        //     defaultLayout.showChildView('content', accessionListView);
        //     defaultLayout.showChildView('content-bottom', new ScrollingMoreView({
        //         collection: collection,
        //         targetView: accessionListView
        //     }));
        //
        //     defaultLayout.showChildView('bottom', new EntityListFilterView({
        //         collection: collection, columns: data[0].value}));
        //
        //     accessionListView.query();
        // });
    },

    // getAccession : function(id, tab) {
    //     tab || (tab = "");
    //
    //     let accession = new AccessionModel({id: id});
    //
    //     let defaultLayout = new DefaultLayout();
    //     window.application.main.showContent(defaultLayout);
    //
    //     accession.fetch().then(function() {
    //         if (!defaultLayout.isRendered()) {
    //             return;
    //         }
    //
    //         defaultLayout.showChildView('title', new TitleView({title: _t("Accession"), model: accession}));
    //
    //         let accessionLayout = new AccessionLayout({model: accession, initialTab: tab.replace('/', '')});
    //         defaultLayout.showChildView('content', accessionLayout);
    //     });
    // }
});

module.exports = Router;
