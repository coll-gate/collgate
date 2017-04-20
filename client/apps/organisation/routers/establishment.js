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

var EstablishmentLayout = require('../views/establishmentlayout');
var DefaultLayout = require('../../main/views/defaultlayout');
var TitleView = require('../../main/views/titleview');


var Router = Marionette.AppRouter.extend({
    routes : {
        "app/organisation/establishment/:id/*tab": "getEstablishment"
    },

    getEstablishment : function(id, tab) {
        tab || (tab = "");

        var establishment = new EstablishmentModel({id: id});

        var defaultLayout = new DefaultLayout();
        application.show(defaultLayout);

        var establishmentLayout = new EstablishmentLayout({model: establishment, initialTab: tab.replace('/', '')});

        establishment.fetch().then(function() {
            defaultLayout.getRegion('title').show(new TitleView({title: gt.gettext("Establishment"), model: establishment}));
            defaultLayout.getRegion('content').show(establishmentLayout);
        });
    }
});

module.exports = Router;
