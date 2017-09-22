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

var LanguageListView = require('../views/languagelist');
var LanguageAddView = require('../views/languageadd');

var EntitySynonymTypeListView = require('../views/entitysynonymtypelist');
var EntitySynonymTypeAddView = require('../views/entitysynonymtypeadd');

var Router = Marionette.AppRouter.extend({
    routes : {
        "app/home/": "home",
        "app/main/about/": "about",
        "app/main/help/": "help",
        "app/main/config/": "config",
        "app/main/language/": "getLanguagesList",
        "app/main/entity-synonym-type/": "getEntitySynonymTypesList",
        "app/*actions": "default"
    },

    default: function(p) {
        $.alert.error("Invalid view : " + p);
    },

    home: function() {
        var HomeView = Marionette.View.extend({
            tagName: 'div',
            className: 'home',
            attributes: { style: "height: 100%; padding: 5px;"},
            template: require('../templates/home.html')
        });

        var defaultLayout = new DefaultLayout({});
        application.main.showContent(defaultLayout);

        defaultLayout.showChildView('title', new TitleView({title: _t("Home")}));

        var quarterLayout = new QuarterLayout();
        defaultLayout.showChildView('content', quarterLayout);

        quarterLayout.showChildView('top-left', new HomeView());

        if (session.user.isAuth) {
            var EventMessagePanelView = require('../views/eventmessagepanel');
            quarterLayout.showChildView('top-right', new EventMessagePanelView());

            var ActionPanelView = require('../views/actionpanel');
            quarterLayout.showChildView('bottom-left', new ActionPanelView());
        }
    },

    about: function() {
        var defaultLayout = new DefaultLayout({});
        application.main.showContent(defaultLayout);

        defaultLayout.showChildView('title', new TitleView({title: _t("About...")}));
        defaultLayout.showChildView('content', new AboutView());
    },

    help: function() {
        var defaultLayout = new DefaultLayout({});
        application.main.showContent(defaultLayout);

        defaultLayout.showChildView('title', new TitleView({title: _t("Help...")}));
        defaultLayout.showChildView('content', new HelpIndexView());
    },

    config: function() {
        var ConfigCollection = require('../collections/config');
        var collection = new ConfigCollection();

        var defaultLayout = new DefaultLayout({});
        application.main.showContent(defaultLayout);

        defaultLayout.showChildView('title', new TitleView({title: _t("Configuration state")}));

        collection.fetch().then(function () {
            var ConfigListView = require('../views/configlist');
            var configListView = new ConfigListView({collection : collection});

            defaultLayout.showChildView('content', configListView);
        });
    },

    getLanguagesList: function () {
        var collection = application.main.collections.languages;

        var defaultLayout = new DefaultLayout({});
        application.main.showContent(defaultLayout);

        defaultLayout.showChildView('title', new TitleView({title: _t("List of languages for data")}));

        collection.fetch().done(function (data) {
            var languageListView = new LanguageListView({collection : collection});

            defaultLayout.showChildView('content', languageListView);
            // defaultLayout.showChildView('content-bottom', new ScrollingMoreView({targetView: languageListView}));
        });

        defaultLayout.showChildView('bottom', new LanguageAddView({collection: collection}));
    },

    getEntitySynonymTypesList: function() {
        var EntitySynonymTypeCollection = require('../collections/entitysynonymtype');
        var collection = new EntitySynonymTypeCollection();

        var defaultLayout = new DefaultLayout({});
        application.main.showContent(defaultLayout);

        defaultLayout.showChildView('title', new TitleView({title: _t("List of type of synonyms for entities")}));

        collection.fetch().done(function (data) {
            var entitySynonymTypeListView = new EntitySynonymTypeListView({collection : collection});

            defaultLayout.showChildView('content', entitySynonymTypeListView);
            // defaultLayout.showChildView('content-bottom', new ScrollingMoreView({targetView: entitySynonymTypeListView}));
        });

        defaultLayout.showChildView('bottom', new EntitySynonymTypeAddView({collection: collection}));
    }
});

module.exports = Router;
