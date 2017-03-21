/**
 * @file init.js
 * @brief Main module init entry point
 * @author Frederic SCHERMA
 * @date 2016-04-12
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

require('./css/main.css');

var MainModule = function() {
    this.name = "main";
};

MainModule.prototype = {
    initialize : function(app, options) {
        //var deferred = $.Deferred();
        //this.loaded = deferred.promise();

        this.models = {};
        this.collections = {};
        this.views = {};
        this.routers = {};

        // i18n if not english
        if (session.language !== "en") {
            try {
                i18next.addResources(session.language, 'default', require('./locale/' + session.language + '/LC_MESSAGES/default.json'));
            } catch (e) {
                console.warn("No translation found for the current language. Fallback to english language");
            }
        }

        /*if (session.language === "fr") {
            i18next.addResources('fr', 'default', require('./locale/fr/LC_MESSAGES/default.json'));

            // inject django json catalog
            //$.get(application.baseUrl + 'jsoni18n/main/django').done(function (data) {
            //    i18next.addResources('fr', 'default', data.catalog);
            //    deferred.resolve("jsoni18n");
            //});
        } else {  // default to english
            //i18next.addResources('en', 'default', require('./locale/en/LC_MESSAGES/default.json'));
        }*/

        //
        // defaults settings
        //

        app.setDefaultUserSetting('ui', {
            display_mode: '2-8-2',
            preferred_language: 'en'
        });

        //
        // collections
        //

        var SelectOption = require('./renderers/selectoption');

        var LanguageCollection = require('./collections/language');
        this.collections.languages = new LanguageCollection();

        this.views.languages = new SelectOption({
            className: 'language',
            collection: this.collections.languages
        });

        var InterfaceLanguageCollection = require('./collections/uilanguage');
        this.collections.uilanguages = new InterfaceLanguageCollection();

        this.views.uilanguages = new SelectOption({
            className: 'ui-language',
            collection: this.collections.uilanguages
        });

        var ContentTypeCollection = require('./collections/contenttype');
        this.collections.contentTypes = new ContentTypeCollection();

        this.views.contentTypes = new SelectOption({
            className: 'content-type',
            collection: this.collections.contentTypes
        });

        var EventMessageCollection = require('./collections/eventmessage');
        this.collections.eventMessages = new EventMessageCollection();

        //
        // routers
        //

        var MainRouter = require('./routers/main');
        this.routers.main = new MainRouter();

        var ProfileRouter = require('./routers/profile');
        this.routers.profile = new ProfileRouter();
    },

    start: function(options) {
        // main view
        var MainView = require('./views/main');
        var mainView = new MainView();
        application.showView(mainView);

        var LeftBarView = require('./views/leftbar');
        mainView.getRegion('left').show(new LeftBarView());
    },

    stop: function(options) {

    },

    defaultLeftView: function() {
        var mainView = application.getView();

        var LeftBarView = require('./views/leftbar');
        mainView.getRegion('left').show(new LeftBarView());
    },

    defaultRightView: function() {
        var mainView = application.getView();
        mainView.getRegion('right').empty();
    }
};

module.exports = MainModule;
