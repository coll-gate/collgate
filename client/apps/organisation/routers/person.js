/**
 * @file person.js
 * @brief Establishment router
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2018-06-01
 * @copyright Copyright (c) 2018 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');

let PersonModel = require('../models/person');

let PersonLayout = require('../views/personlayout');
let DefaultLayout = require('../../main/views/defaultlayout');
let TitleView = require('../../main/views/titleview');


let Router = Marionette.AppRouter.extend({
    routes : {
        "app/organisation/person/:id/*tab": "getPerson"
    },

    getPerson : function(id, tab) {
        tab || (tab = "");

        let person = new PersonModel({id: id});

        let defaultLayout = new DefaultLayout();
        window.application.main.showContent(defaultLayout);

        let personLayout = new PersonLayout({model: person, initialTab: tab.replace('/', '')});

        person.fetch().then(function() {
            defaultLayout.showChildView('title', new TitleView({title: _t("Person/Contact"), model: person}));
            defaultLayout.showChildView('content', personLayout);
        });
    }
});

module.exports = Router;
