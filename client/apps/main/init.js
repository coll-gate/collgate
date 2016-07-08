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

//mainStyle = require('./css/main.css');  // included in main.html on django side

//
// Main module definition
//

var MainModule = Marionette.Module.extend({

    initialize: function(moduleName, app, options) {
        Logger.time("Init main module");

        // i18n
        if (session.language === "fr") {
            i18next.addResources('fr', 'default', require('./locale/fr/LC_MESSAGES/default.json'));
            //gt.addTextdomain('default', require('./locale/fr/LC_MESSAGES/default.mo'));
        } else {  // default to english
            i18next.addResources('en', 'default', require('./locale/en/LC_MESSAGES/default.json'));
            //gt.addTextdomain('default', require('./locale/en/LC_MESSAGES/default.mo'));
        }

        this.models = {};
        this.collections = {};
        this.views = {};
        this.routers = {};

        var SelectOptionItemView = require('./views/selectoptionitemview');

        var LanguageCollection = require('./collections/language');
        this.collections.languages = new LanguageCollection();

        this.views.languages = new SelectOptionItemView({
            className: 'language',
            collection: this.collections.languages,
        });

        var ContentTypeCollection = require('./collections/contenttype');
        this.collections.contentType = new ContentTypeCollection();

        this.views.contentTypes = new SelectOptionItemView({
            className: 'content-type',
            collection: this.collections.contentType,
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

var main =  ohgr.module("main", MainModule);

module.exports = main;
