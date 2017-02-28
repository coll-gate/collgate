/**
 * @file init.js
 * @brief Organisation module init entry point
 * @author Frederic SCHERMA
 * @date 2017-02-27
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var OrganisationModule = function() {
    this.name = "organisation";
};

OrganisationModule.prototype = {
    initialize: function(app, options) {
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
        // collections
        //


        //
        // controllers
        //


        //
        // routers
        //

        var OrganisationRouter = require('./routers/organisation');
        this.routers.organisation = new OrganisationRouter();
    },

    start: function(options) {
        // nothing to do
    },

    stop: function(options) {

    }
};

module.exports = OrganisationModule;
