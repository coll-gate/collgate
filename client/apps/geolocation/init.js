/**
 * @file init.js
 * @brief Geolocation module init entry point
 * @author Medhi BOULNEMOUR
 * @date 2017-02-23
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var GeolocationModule = function() {
    this.name = "geolocation";
};

GeolocationModule.prototype = {
    initialize: function(app, options) {
        Logger.time("Init geolocation module");

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
                console.warn("No translation found for the current language. Fallback to english language");
            }
        }

        //
        // descriptor format types
        //

        // register the format type of descriptors
        var widgets = [
            'country',
            'city'
        ];

        for (var i = 0; i < widgets.length; ++i) {
            var moduleName = widgets[i];
            application.descriptor.widgets.registerElement(widgets[i], require('./widgets/' + moduleName));
        }

        //
        // routers
        //


        Logger.timeEnd("Init geolocation module");
    },

    start: function(options) {
        Logger.time("Start geolocation module");

        // nothing to do

        Logger.timeEnd("Start geolocation module");
    },

    stop: function(options) {
    }
};

module.exports = GeolocationModule;
