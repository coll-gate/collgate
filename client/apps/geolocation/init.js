/**
 * @file init.js
 * @brief Geolocation module init entry point
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2017-02-23
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var GeolocationModule = function() {
    this.name = "geolocation";
};

GeolocationModule.prototype = {
    initialize: function(app, options) {

        this.models = {};
        this.collections = {};
        this.views = {};
        this.routers = {};
        this.controllers = {};

        try {
            i18next.default.addResources(session.language, 'default', require('./locale/' + session.language + '/default.json'));
        } catch (e) {
            console.warn("No translation found for the current language. Fallback to english language");
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
    },

    start: function(app, options) {
        // nothing to do
    },

    stop: function(app, options) {
    }
};

module.exports = GeolocationModule;
