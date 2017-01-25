/**
 * @file init.js
 * @brief Media library module init entry point
 * @author Frederic SCHERMA
 * @date 2017-01-09
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var MediaLibraryModule = Marionette.Module.extend({

    initialize: function(moduleName, app, options) {
        Logger.time("Init medialibrary module");

        this.models = {};
        this.collections = {};
        this.views = {};
        this.routers = {};
        this.controllers = {};

        // i18n if not english
        if (session.language !== "en") {
            try {
                i18next.addResources(session.language, 'default', require('./locale/' + session.language + '/LC_MESSAGES/default.json'));
            } catch (e) {
                console.warning("No translation found for the current language. Fallback to english language");
            }
        }

        Logger.timeEnd("Init medialibrary module");
    },

    onStart: function(options) {
        Logger.time("Start permission module");

        // register the format type of descriptors
        var widgets = [
            'media',
            'media_collection'
        ];

        for (var i = 0; i < widgets.length; ++i) {
            var moduleName = widgets[i].replace('_', '').toLowerCase();
            application.descriptor.widgets.registerElement(widgets[i], require('./widgets/' + moduleName));
        }

        //var MediaLibraryRouter = require('./routers/medialibrary');
        //this.routers.medialibrary = new MediaLibraryRouter();

        Logger.timeEnd("Start medialibrary module");
    },

    onStop: function(options) {
    },
});

// medialibrary module
var medialibrary = application.module("medialibrary", MediaLibraryModule);

module.exports = medialibrary;
