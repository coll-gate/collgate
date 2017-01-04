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

//
// Main module definition
//

var MainModule = Marionette.Module.extend({

    initialize: function(moduleName, app, options) {
        Logger.time("Init main module");

        //var deferred = $.Deferred();
        //this.loaded = deferred.promise();

        this.models = {};
        this.collections = {};
        this.views = {};
        this.routers = {};

        // i18n
        if (session.language === "fr") {
            i18next.addResources('fr', 'default', require('./locale/fr/LC_MESSAGES/default.json'));

            /*// inject django json catalog
            $.get(application.baseUrl + 'jsoni18n/main/django').done(function (data) {
                i18next.addResources('fr', 'default', data.catalog);
                deferred.resolve("jsoni18n");
            });*/
        } else {  // default to english
            //i18next.addResources('en', 'default', require('./locale/en/LC_MESSAGES/default.json'));
        }

        var SelectOptionItemView = require('./views/selectoptionitemview');

        var LanguageCollection = require('./collections/language');
        this.collections.languages = new LanguageCollection();

        this.views.languages = new SelectOptionItemView({
            className: 'language',
            collection: this.collections.languages,
        });

        var InterfaceLanguageCollection = require('./collections/uilanguage');
        this.collections.uilanguages = new InterfaceLanguageCollection();

        this.views.uilanguages = new SelectOptionItemView({
            className: 'ui-language',
            collection: this.collections.uilanguages,
        });

        var ContentTypeCollection = require('./collections/contenttype');
        this.collections.contentTypes = new ContentTypeCollection();

        this.views.contentTypes = new SelectOptionItemView({
            className: 'content-type',
            collection: this.collections.contentTypes,
        });

        this.views.Home = Marionette.CompositeView.extend({
            el: '#main_content',
            template: require('./templates/home.html'),
        });

        Logger.timeEnd("Init main module");
    },

    onStart: function(options) {
        Logger.time("Start main module");

        var MainRouter = require('./routers/main');
        this.routers.main = new MainRouter();

        var ProfileRouter = require('./routers/profile');
        this.routers.profile = new ProfileRouter();

        Logger.timeEnd("Start main module");
    },

    onStop: function(options) {

    },
});

var main =  application.module("main", MainModule);

module.exports = main;
