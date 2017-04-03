/**
 * @file establishment.js
 * @brief Establishment router
 * @author Frederic SCHERMA
 * @date 2017-03-06
 * @copyright Copyright (c) 2017 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var EstablishmentModel = require('../models/establishment');
var EstablishmentCollection = require('../collections/establishment');

//var EstablishmentListView = require('../views/establishmentlist');
//var EstablishmentListFilterView = require('../views/establishmentlistfilter');

var EstablishmentLayout = require('../views/establishmentlayout');
var DefaultLayout = require('../../main/views/defaultlayout');
var ScrollingMoreView = require('../../main/views/scrollingmore');
var TitleView = require('../../main/views/titleview');


var Router = Marionette.AppRouter.extend({
    routes : {
        "app/organisation/organisation/:id/establishment/": "getEstablishmentList",
        "app/organisation/establishment/:id/": "getEstablishment"
    },

    getEstablishmentList : function() {
        $.alert.error("Not yet !");
    },

    getEstablishment : function(id) {
        var establishment = new EstablishmentModel({id: id});

        var defaultLayout = new DefaultLayout();
        application.show(defaultLayout);

        var establishmentLayout = new EstablishmentLayout({model: establishment});

        establishment.fetch().then(function() {
            defaultLayout.getRegion('title').show(new TitleView({title: gt.gettext("Establishment"), model: establishment}));
            defaultLayout.getRegion('content').show(establishmentLayout);
        });
    }
});

module.exports = Router;
