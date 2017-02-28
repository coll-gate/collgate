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

// var OrganisationListView = require('../views/organisationlist');

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
        $.alert.error("Not yet !");
    },

    getOrganisationList : function() {
        $.alert.error("Not yet !");
    },

    getOrganisation : function(id) {
        $.alert.error("Not yet !");
    }
});

module.exports = Router;
