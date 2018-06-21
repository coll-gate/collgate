/**
 * @file conservatory.js
 * @brief Conservatory router
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2018-06-21
 * @copyright Copyright (c) 2018 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');

let ConservatoryModel = require('../models/conservatory');

let ConservatoryLayout = require('../views/conservatorylayout');
let DefaultLayout = require('../../main/views/defaultlayout');
let TitleView = require('../../main/views/titleview');


let Router = Marionette.AppRouter.extend({
    routes : {
        "app/organisation/conservatory/:id/*tab": "getConservatory"
    },

    getConservatory : function(id, tab) {
        tab || (tab = "");

        let conservatory = new ConservatoryModel({id: id});

        let defaultLayout = new DefaultLayout();
        window.application.main.showContent(defaultLayout);

        let conservatoryLayout = new ConservatoryLayout({model: conservatory, initialTab: tab.replace('/', '')});

        conservatory.fetch().then(function() {
            defaultLayout.showChildView('title', new TitleView({title: _t("Conservatory"), model: conservatory}));
            defaultLayout.showChildView('content', conservatoryLayout);
        });
    }
});

module.exports = Router;
