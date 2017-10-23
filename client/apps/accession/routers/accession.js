/**
 * @file accession.js
 * @brief Accession router
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-07-19
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');

let AccessionModel = require('../models/accession');
let AccessionCollection = require('../collections/accession');
let AccessionListView = require('../views/accessionlist');
let EntityListFilterView = require('../../descriptor/views/entitylistfilter');

let DefaultLayout = require('../../main/views/defaultlayout');
let ScrollingMoreView = require('../../main/views/scrollingmore');
let TitleView = require('../../main/views/titleview');
let AccessionLayout = require('../views/accessionlayout');

let Router = Marionette.AppRouter.extend({
    routes : {
        "app/accession/accession/": "getAccessionList",
        "app/accession/accession/:id/*tab": "getAccession"
    },

    getAccessionList : function(options) {
        options || (options = {});

        let collection = new AccessionCollection([], {
            filters: (options.filters || {}),
            search: (options.search || {})
        });

        let defaultLayout = new DefaultLayout({});
        application.main.showContent(defaultLayout);

        defaultLayout.showChildView('title', new TitleView({title: _t("List of accessions")}));

        // get available columns
        let columns = application.main.cache.lookup({
            type: 'entity_columns',
            format: {model: 'accession.accession'}
        });

        columns.done(function (data) {
            let accessionListView = new AccessionListView({
                collection : collection, columns: data[0].value,
                onRender: function () {
                    this.onShowTab();
                }
            });

            defaultLayout.showChildView('content', accessionListView);
            defaultLayout.showChildView('content-bottom', new ScrollingMoreView({
                collection: collection,
                targetView: accessionListView
            }));

            defaultLayout.showChildView('bottom', new EntityListFilterView({
                collection: collection, columns: data[0].value}));

            accessionListView.query();
        });
    },

    getAccession : function(id, tab) {
        tab || (tab = "");

        let accession = new AccessionModel({id: id});

        let defaultLayout = new DefaultLayout();
        application.main.showContent(defaultLayout);

        accession.fetch().then(function() {
            if (!defaultLayout.isRendered()) {
                return;
            }

            defaultLayout.showChildView('title', new TitleView({title: _t("Accession"), model: accession}));

            let accessionLayout = new AccessionLayout({model: accession, initialTab: tab.replace('/', '')});
            defaultLayout.showChildView('content', accessionLayout);
        });
    }
});

module.exports = Router;
