/**
 * @file organisation.js
 * @brief Organisation router
 * @author Frederic SCHERMA
 * @date 2017-02-28
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var GRCModel = require('../models/grc');
var OrganisationModel = require('../models/organisation');
var EshtablishmentModel = require('../models/establishment');

var OrganisationCollection = require('../collections/organisation');
var EstablishmentCollection = require('../collections/establishment');

var OrganisationListView = require('../views/organisationlist');

var DefaultLayout = require('../../main/views/defaultlayout');
var ScrollingMoreView = require('../../main/views/scrollingmore');
var TitleView = require('../../main/views/titleview');

var Router = Marionette.AppRouter.extend({
    routes : {
        "app/organisation/grc/": "getGRC",
        "app/organisation/organisation/": "getOrganisationList",
        "app/organisation/organisation/:id/": "getOrganisation"
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
            var taxonListView = new OrganisationListView({collection : collection});

            defaultLayout.getRegion('content').show(taxonListView);
            defaultLayout.getRegion('content-bottom').show(new ScrollingMoreView({targetView: taxonListView}));
        });

        defaultLayout.getRegion('bottom').show(new TaxonListFilterView({collection: collection}));
    },

    getOrganisationList : function() {
        $.alert.error("Not yet !");
    },

    getOrganisation : function(id) {
        $.alert.error("Not yet !");
    }
});

module.exports = Router;
