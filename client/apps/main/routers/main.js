/**
 * @file main.js
 * @brief Main router
 * @author Frederic SCHERMA
 * @date 2016-06-14
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var AboutView = require('../views/about');
var HelpIndexView = require('../views/help/index');
var DefaultLayout = require('../views/defaultlayout');
var TitleView = require('../views/titleview');

var Router = Marionette.AppRouter.extend({
    routes : {
        "app/home/": "home",
        "app/main/about/": "about",
        "app/main/help/": "help",
        "app/*actions": "default",
    },

    default: function(p) {
        alert("what ??! : " + p);
    },

    home: function() {
        var HomeView = Marionette.ItemView.extend({
            tagName: 'div',
            className: 'about',
            template: require('../templates/home.html')
        });

        var defaultLayout = new DefaultLayout({});
        application.getRegion('mainRegion').show(defaultLayout);

        defaultLayout.getRegion('title').show(new TitleView({title: gt.gettext("Accueil")}));
        defaultLayout.getRegion('content').show(new HomeView());
    },

    about: function() {
        var defaultLayout = new DefaultLayout({});
        application.getRegion('mainRegion').show(defaultLayout);

        defaultLayout.getRegion('title').show(new TitleView({title: gt.gettext("About...")}));
        defaultLayout.getRegion('content').show(new AboutView());
    },

    help: function() {
        var defaultLayout = new DefaultLayout({});
        application.getRegion('mainRegion').show(defaultLayout);

        defaultLayout.getRegion('title').show(new TitleView({title: gt.gettext("Help...")}));
        defaultLayout.getRegion('content').show(new HelpIndexView());
    }
});

module.exports = Router;
