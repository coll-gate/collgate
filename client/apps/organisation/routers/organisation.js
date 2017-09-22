/**
 * @file organisation.js
 * @brief Organisation router
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-02-28
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Marionette = require('backbone.marionette');

var GRCModel = require('../models/grc');
var OrganisationModel = require('../models/organisation');

var OrganisationCollection = require('../collections/organisation');

var OrganisationListView = require('../views/organisationlist');
var OrganisationListFilterView = require('../views/organisationlistfilter');
var OrganisationLayout = require('../views/organisationlayout');

var DefaultLayout = require('../../main/views/defaultlayout');
var ScrollingMoreView = require('../../main/views/scrollingmore');
var TitleView = require('../../main/views/titleview');

var Router = Marionette.AppRouter.extend({
    routes : {
        "app/organisation/grc/": "getGRC",
        "app/organisation/grc/organisation/": "getGRCOrganisationList",
        "app/organisation/organisation/": "getOrganisationList",
        "app/organisation/organisation/:id/*tab": "getOrganisation"
    },

    getGRC: function () {
        var grc = new GRCModel();

        var defaultLayout = new DefaultLayout();
        application.main.showContent(defaultLayout);

        var GRCDetailsView = require('../views/grcdetails');
        var grcDetails = new GRCDetailsView({model: grc});

        grc.fetch().then(function () {
            defaultLayout.showChildView('title', new TitleView({title: _t("GRC details"), model: grc}));
            defaultLayout.showChildView('content', grcDetails);
        });
    },

    getGRCOrganisationList : function() {
        var collection = new OrganisationCollection([], {grc: true});

        var defaultLayout = new DefaultLayout({});
        application.main.showContent(defaultLayout);

        defaultLayout.showChildView('title', new TitleView({title: _t("List of GRC partners")}));

        collection.fetch().then(function () {
            var organisationListView = new OrganisationListView({collection : collection});

            defaultLayout.showChildView('content', organisationListView);
            defaultLayout.showChildView('content-bottom', new ScrollingMoreView({targetView: organisationListView}));
        });

        defaultLayout.showChildView('bottom', new OrganisationListFilterView({collection: collection}));
    },

    getOrganisationList : function() {
        var collection = new OrganisationCollection([]);

        var defaultLayout = new DefaultLayout({});
        application.main.showContent(defaultLayout);

        defaultLayout.showChildView('title', new TitleView({title: _t("List of organisations")}));

        collection.fetch().then(function () {
            var organisationListView = new OrganisationListView({collection : collection});

            defaultLayout.showChildView('content', organisationListView);
            defaultLayout.showChildView('content-bottom', new ScrollingMoreView({targetView: organisationListView}));
        });

        defaultLayout.showChildView('bottom', new OrganisationListFilterView({collection: collection}));
    },

    getOrganisation : function(id, tab) {
        tab || (tab = "");

        var organisation = new OrganisationModel({id: id});

        var defaultLayout = new DefaultLayout();
        application.main.showContent(defaultLayout);

        var organisationLayout = new OrganisationLayout({model: organisation, initialTab: tab.replace('/', '')});

        organisation.fetch().then(function() {
            defaultLayout.showChildView('title', new TitleView({title: _t("Organisation"), model: organisation}));
            defaultLayout.showChildView('content', organisationLayout);
        });
    }
});

module.exports = Router;
