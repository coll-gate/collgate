/**
 * @file organisation.js
 * @brief Organisation router
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-02-28
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let Marionette = require('backbone.marionette');

let GRCModel = require('../models/grc');
let OrganisationModel = require('../models/organisation');

let OrganisationCollection = require('../collections/organisation');

let OrganisationListView = require('../views/organisationlist');
let OrganisationListFilterView = require('../views/organisationlistfilter');
let OrganisationLayout = require('../views/organisationlayout');

let DefaultLayout = require('../../main/views/defaultlayout');
let ScrollingMoreView = require('../../main/views/scrollingmore');
let TitleView = require('../../main/views/titleview');

let Router = Marionette.AppRouter.extend({
    routes : {
        "app/organisation/grc/": "getGRC",
        "app/organisation/grc/organisation/": "getGRCOrganisationList",
        "app/organisation/organisation/": "getOrganisationList",
        "app/organisation/organisation/:id/*tab": "getOrganisation"
    },

    getGRC: function () {
        let grc = new GRCModel();

        let defaultLayout = new DefaultLayout();
        application.main.showContent(defaultLayout);

        let GRCDetailsView = require('../views/grcdetails');
        let grcDetails = new GRCDetailsView({model: grc});

        grc.fetch().then(function () {
            defaultLayout.showChildView('title', new TitleView({title: _t("GRC details"), model: grc}));
            defaultLayout.showChildView('content', grcDetails);
        });
    },

    getGRCOrganisationList : function() {
        let collection = new OrganisationCollection([], {grc: true});

        let defaultLayout = new DefaultLayout({});
        application.main.showContent(defaultLayout);

        defaultLayout.showChildView('title', new TitleView({title: _t("List of GRC partners")}));

        collection.fetch().then(function () {
            let organisationListView = new OrganisationListView({collection : collection});

            defaultLayout.showChildView('content', organisationListView);
            defaultLayout.showChildView('content-bottom', new ScrollingMoreView({targetView: organisationListView}));
        });

        defaultLayout.showChildView('bottom', new OrganisationListFilterView({collection: collection}));
    },

    getOrganisationList : function() {
        let collection = new OrganisationCollection([]);

        let defaultLayout = new DefaultLayout({});
        application.main.showContent(defaultLayout);

        defaultLayout.showChildView('title', new TitleView({title: _t("List of organisations")}));

        collection.fetch().then(function () {
            let organisationListView = new OrganisationListView({collection : collection});

            defaultLayout.showChildView('content', organisationListView);
            defaultLayout.showChildView('content-bottom', new ScrollingMoreView({targetView: organisationListView}));
        });

        defaultLayout.showChildView('bottom', new OrganisationListFilterView({collection: collection}));
    },

    getOrganisation : function(id, tab) {
        tab || (tab = "");

        let organisation = new OrganisationModel({id: id});

        let defaultLayout = new DefaultLayout();
        application.main.showContent(defaultLayout);

        let organisationLayout = new OrganisationLayout({model: organisation, initialTab: tab.replace('/', '')});

        organisation.fetch().then(function() {
            defaultLayout.showChildView('title', new TitleView({title: _t("Organisation"), model: organisation}));
            defaultLayout.showChildView('content', organisationLayout);
        });
    }
});

module.exports = Router;
