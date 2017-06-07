/**
 * @file main.js
 * @brief Main router
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-06-14
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Marionette = require('backbone.marionette');
var AboutView = require('../views/about');
var HelpIndexView = require('../views/help/index');
var DefaultLayout = require('../views/defaultlayout');
var QuarterLayout = require('../views/quarterlayout');
var TitleView = require('../views/titleview');

var LanguageCollection = require('../collections/language');
var LanguageListView = require('../views/languagelist');
var LanguageAddView = require('../views/languageadd');

var Router = Marionette.AppRouter.extend({
    routes : {
        "app/home/": "home",
        "app/main/about/": "about",
        "app/main/help/": "help",
        "app/main/config/": "config",
        "app/main/language/": "getLanguagesList",
        "app/*actions": "default"
    },

    default: function(p) {
        $.alert.error("Invalid view : " + p);
    },

    home: function() {
        var HomeView = Marionette.LayoutView.extend({
            tagName: 'div',
            className: 'home',
            attributes: { style: "height: 100%; padding: 5px;"},
            template: require('../templates/home.html')
        });

        var defaultLayout = new DefaultLayout({});
        application.show(defaultLayout);

        defaultLayout.getRegion('title').show(new TitleView({title: gt.gettext("Home")}));

        var quarterLayout = new QuarterLayout();
        defaultLayout.getRegion('content').show(quarterLayout);

        quarterLayout.getRegion('top-left').show(new HomeView());

        if (session.user.isAuth) {
            var EventMessagePanelView = require('../views/eventmessagepanel');
            quarterLayout.getRegion('top-right').show(new EventMessagePanelView());

            var ActionPanelView = require('../views/actionpanel');
            quarterLayout.getRegion('bottom-left').show(new ActionPanelView());
        }
    },

    about: function() {
        var defaultLayout = new DefaultLayout({});
        application.show(defaultLayout);

        defaultLayout.getRegion('title').show(new TitleView({title: gt.gettext("About...")}));
        defaultLayout.getRegion('content').show(new AboutView());
    },

    help: function() {
        var defaultLayout = new DefaultLayout({});
        application.show(defaultLayout);

        defaultLayout.getRegion('title').show(new TitleView({title: gt.gettext("Help...")}));
        defaultLayout.getRegion('content').show(new HelpIndexView());
    },

    config: function() {
        var ConfigCollection = require('../collections/config');
        var collection = new ConfigCollection();

        var defaultLayout = new DefaultLayout({});
        application.show(defaultLayout);

        defaultLayout.getRegion('title').show(new TitleView({title: gt.gettext("Configuration state")}));

        collection.fetch().then(function () {
            var ConfigListView = require('../views/configlist');
            var configListView = new ConfigListView({collection : collection});

            defaultLayout.getRegion('content').show(configListView);
        });
    },

    getLanguagesList: function () {
        var collection = application.main.collections.languages;

        var defaultLayout = new DefaultLayout({});
        application.show(defaultLayout);

        defaultLayout.getRegion('title').show(new TitleView({title: gt.gettext("List of languages for data")}));

        collection.fetch().done(function (data) {
            var languageListView = new LanguageListView({collection : collection});

            defaultLayout.getRegion('content').show(languageListView);
            // defaultLayout.getRegion('content-bottom').show(new ScrollingMoreView({targetView: languageListView}));
        });

        defaultLayout.getRegion('bottom').show(new LanguageAddView({collection: collection}));
    }
});

module.exports = Router;
