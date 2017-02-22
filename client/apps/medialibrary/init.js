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

require("./css/medialibrary.css");

require("imageviewer");
require("imageviewer/dist/viewer.min.css");

var MediaLibraryModule = function() {
    this.name = "medialibrary";
};

MediaLibraryModule.prototype = {
    initialize: function(app, options) {
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

        //
        // descriptor format types
        //

        // register the format type of descriptors
        var widgets = [
            'media',
            'media_collection'
        ];

        for (var i = 0; i < widgets.length; ++i) {
            var moduleName = widgets[i].replace('_', '').toLowerCase();
            application.descriptor.widgets.registerElement(widgets[i], require('./widgets/' + moduleName));
        }

        //
        // routers
        //

        //var MediaLibraryRouter = require('./routers/medialibrary');
        //this.routers.medialibrary = new MediaLibraryRouter();

        Logger.timeEnd("Init medialibrary module");
    },

    start: function(options) {
        Logger.time("Start medialibrary module");

        // nothing to do

        Logger.timeEnd("Start medialibrary module");
    },

    stop: function(options) {
    }
};

module.exports = MediaLibraryModule;
