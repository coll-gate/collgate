/**
 * @file organisation.js
 * @brief Organisation router
 * @author Frederic SCHERMA
 * @date 2017-02-28
 * @copyright Copyright (c) 2017 INRA UMR1095 GDEC
 * @license @todo
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
        application.show(defaultLayout);

        var GRCDetailsView = require('../views/grcdetails');
        var grcDetails = new GRCDetailsView({model: grc});

        grc.fetch().then(function () {
            defaultLayout.getRegion('title').show(new TitleView({title: gt.gettext("GRC details"), model: grc}));
            defaultLayout.getRegion('content').show(grcDetails);
        });
    },

    getGRCOrganisationList : function() {
        var collection = new OrganisationCollection([], {grc: true});

        var defaultLayout = new DefaultLayout({});
        application.show(defaultLayout);

        defaultLayout.getRegion('title').show(new TitleView({title: gt.gettext("List of GRC partners")}));

        collection.fetch().then(function () {
            var organisationListView = new OrganisationListView({collection : collection});

            defaultLayout.getRegion('content').show(organisationListView);
            defaultLayout.getRegion('content-bottom').show(new ScrollingMoreView({targetView: organisationListView}));
        });

        defaultLayout.getRegion('bottom').show(new OrganisationListFilterView({collection: collection}));
    },

    getOrganisationList : function() {
        var collection = new OrganisationCollection([]);

        var defaultLayout = new DefaultLayout({});
        application.show(defaultLayout);

        defaultLayout.getRegion('title').show(new TitleView({title: gt.gettext("List of organisations")}));

        collection.fetch().then(function () {
            var organisationListView = new OrganisationListView({collection : collection});

            defaultLayout.getRegion('content').show(organisationListView);
            defaultLayout.getRegion('content-bottom').show(new ScrollingMoreView({targetView: organisationListView}));
        });

        defaultLayout.getRegion('bottom').show(new OrganisationListFilterView({collection: collection}));
    },

    getOrganisation : function(id, tab) {
        tab || (tab = "");

        var organisation = new OrganisationModel({id: id});

        var defaultLayout = new DefaultLayout();
        application.show(defaultLayout);

        var organisationLayout = new OrganisationLayout({model: organisation, initialTab: tab.replace('/', '')});

        organisation.fetch().then(function() {
            defaultLayout.getRegion('title').show(new TitleView({title: gt.gettext("Organisation"), model: organisation}));
            defaultLayout.getRegion('content').show(organisationLayout);
        });
    }
});

module.exports = Router;
