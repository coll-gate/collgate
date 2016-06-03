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

mainStyle = require('./css/main.css');

//
// Main module definition
//

var MainModule = Marionette.Module.extend({

    initialize: function(moduleName, app, options) {
        this.models = {};
        this.collections = {};
        this.views = {};
        this.routers = {};

        // i18n
        if (user.language === "en") {
            var locale = require('./locale/en/LC_MESSAGES/default.po');
            gt.addTextdomain('default', locale);
        } else if (user.language === "fr") {
            locale = require('./locale/fr/LC_MESSAGES/default.po');
            gt.addTextdomain('default', locale);
        } else {  // default to english
            var locale = require('./locale/en/LC_MESSAGES/default.po');
            gt.addTextdomain('default', locale);
        }

        var SelectOptionItemView = require('./views/selectoptionitemview');

        var LanguageCollection = require('./collections/language');
        this.collections.languages = new LanguageCollection();

        this.views.languages = new SelectOptionItemView({
            className: 'language',
            collection: this.collections.languages,
        });

        var SynoymTypeCollection = require('./collections/synonymtype');
        this.collections.synonymTypes = new SynoymTypeCollection();

        this.views.synonymTypes = new SelectOptionItemView({
            className: 'synonym-type',
            collection: this.collections.synonymTypes,/*
            collection: new Backbone.Collection([
                {id: 60, value: django.gettext("Family")},
                {id: 61, value: django.gettext("Sub-family")},
                {id: 70, value: django.gettext("Genus")},
                {id: 71, value: django.gettext("Sub-genus")},
                {id: 80, value: django.gettext("Specie")},
                {id: 81, value: django.gettext("Sub-specie")}
            ]);*/
        });

        this.views.Home = Marionette.CompositeView.extend({
            el: '#main_content',
            template: require('./templates/home.html'),
        });
    },

    onStart: function(options) {
        var module = this;

        var MainRouter = Marionette.AppRouter.extend({
            routes : {
                "app/home/": "getHome",
                "app/profile/logout": "getHome",
                "app/profile/edit": "editProfile",
                "app/*actions": "default",
            },
            default: function(p) {
                alert("what ??! : " + p);
            },
            getHome: function() {
                var home = new module.views.Home();
                home.render();
            },
            editProfile: function () {

            }
        });
        this.routers.main = new MainRouter();

        var LanguageRouter = require('./routers/language');
        this.routers.language = new LanguageRouter();

        var ProfileRouter = require('./routers/profile');
        this.routers.profile = new ProfileRouter();
    },

    onStop: function(options) {

    },
});

var main =  ohgr.module("main", MainModule);

module.exports = main;
