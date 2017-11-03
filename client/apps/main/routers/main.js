/**
 * @file main.js
 * @brief Main router
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-06-14
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let Marionette = require('backbone.marionette');
let AboutView = require('../views/about');
let HelpIndexView = require('../views/help/index');
let DefaultLayout = require('../views/defaultlayout');
let QuarterLayout = require('../views/quarterlayout');
let TitleView = require('../views/titleview');

let LanguageListView = require('../views/languagelist');
let LanguageAddView = require('../views/languageadd');

let EntitySynonymTypeListView = require('../views/entitysynonymtypelist');
let EntitySynonymTypeAddView = require('../views/entitysynonymtypeadd');

let Router = Marionette.AppRouter.extend({
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
        let HomeView = Marionette.View.extend({
            tagName: 'div',
            className: 'home',
            attributes: { style: "height: 100%; padding: 5px;"},
            template: require('../templates/home.html')
        });

        let defaultLayout = new DefaultLayout({});
        application.main.showContent(defaultLayout);

        defaultLayout.showChildView('title', new TitleView({title: _t("Home")}));

        let quarterLayout = new QuarterLayout();
        defaultLayout.showChildView('content', quarterLayout);

        quarterLayout.showChildView('top-left', new HomeView());

        if (session.user.isAuth) {
            let EventMessagePanelView = require('../views/eventmessagepanel');
            quarterLayout.showChildView('top-right', new EventMessagePanelView());

            let ActionPanelView = require('../views/actionpanel');
            quarterLayout.showChildView('bottom-left', new ActionPanelView());
        }
    },

    about: function() {
        let defaultLayout = new DefaultLayout({});
        application.main.showContent(defaultLayout);

        defaultLayout.showChildView('title', new TitleView({title: _t("About...")}));
        defaultLayout.showChildView('content', new AboutView());
    },

    help: function() {
        let defaultLayout = new DefaultLayout({});
        application.main.showContent(defaultLayout);

        defaultLayout.showChildView('title', new TitleView({title: _t("Help...")}));
        defaultLayout.showChildView('content', new HelpIndexView());
    },

    config: function() {
        let ConfigCollection = require('../collections/config');
        let collection = new ConfigCollection();

        let defaultLayout = new DefaultLayout({});
        application.main.showContent(defaultLayout);

        defaultLayout.showChildView('title', new TitleView({title: _t("Configuration state")}));

        collection.fetch().then(function () {
            let ConfigListView = require('../views/configlist');
            let configListView = new ConfigListView({collection : collection});

            defaultLayout.showChildView('content', configListView);
        });
    },

    getLanguagesList: function () {
        let collection = application.main.collections.languages;

        let defaultLayout = new DefaultLayout({});
        application.main.showContent(defaultLayout);

        defaultLayout.showChildView('title', new TitleView({title: _t("List of languages for data")}));

        collection.fetch().done(function (data) {
            let languageListView = new LanguageListView({collection : collection});

            defaultLayout.showChildView('content', languageListView);
            // defaultLayout.showChildView('content-bottom', new ScrollingMoreView({targetView: languageListView}));
        });

        defaultLayout.showChildView('bottom', new LanguageAddView({collection: collection}));
    },

    getEntitySynonymTypesList: function() {
        let EntitySynonymTypeCollection = require('../collections/entitysynonymtype');
        let collection = new EntitySynonymTypeCollection();

        let defaultLayout = new DefaultLayout({});
        application.main.showContent(defaultLayout);

        defaultLayout.showChildView('title', new TitleView({title: _t("List of type of synonyms for entities")}));

        collection.fetch().done(function (data) {
            let entitySynonymTypeListView = new EntitySynonymTypeListView({collection : collection});

            defaultLayout.showChildView('content', entitySynonymTypeListView);
            // defaultLayout.showChildView('content-bottom', new ScrollingMoreView({targetView: entitySynonymTypeListView}));
        });

        defaultLayout.showChildView('bottom', new EntitySynonymTypeAddView({collection: collection}));
    }
});

module.exports = Router;
