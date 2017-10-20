/**
 * @file establishment.js
 * @brief Establishment router
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-03-06
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let Marionette = require('backbone.marionette');

let EstablishmentModel = require('../models/establishment');

let EstablishmentLayout = require('../views/establishmentlayout');
let DefaultLayout = require('../../main/views/defaultlayout');
let TitleView = require('../../main/views/titleview');


let Router = Marionette.AppRouter.extend({
    routes : {
        "app/organisation/establishment/:id/*tab": "getEstablishment"
    },

    getEstablishment : function(id, tab) {
        tab || (tab = "");

        let establishment = new EstablishmentModel({id: id});

        let defaultLayout = new DefaultLayout();
        application.main.showContent(defaultLayout);

        let establishmentLayout = new EstablishmentLayout({model: establishment, initialTab: tab.replace('/', '')});

        establishment.fetch().then(function() {
            defaultLayout.showChildView('title', new TitleView({title: _t("Establishment"), model: establishment}));
            defaultLayout.showChildView('content', establishmentLayout);
        });
    }
});

module.exports = Router;
