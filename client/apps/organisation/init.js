/**
 * @file init.js
 * @brief Organisation module init entry point
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-02-27
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
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
                i18next.default.addResources(session.language, 'default', require('./locale/' + session.language + '/LC_MESSAGES/default.json'));
            } catch (e) {
                console.warn("No translation found for the current language. Fallback to english language");
            }
        }

        //
        // collections
        //

        var SelectOption = require('../main/renderers/selectoption');

        var OrganisationTypeCollection = require('./collections/organisationtype');
        this.collections.organisationTypes = new OrganisationTypeCollection();

        this.views.organisationTypes = new SelectOption({
            className: 'organisation-type',
            collection: this.collections.organisationTypes
        });

        //
        // controllers
        //

        var OrganisationController = require('./controllers/organisation');
        this.controllers.organisation = new OrganisationController();

        //
        // routers
        //

        var OrganisationRouter = require('./routers/organisation');
        this.routers.organisation = new OrganisationRouter();

        var EstablishmentRouter = require('./routers/establishment');
        this.routers.establishment = new EstablishmentRouter();
    },

    start: function(options) {
        // nothing to do
    },

    stop: function(options) {

    }
};

module.exports = OrganisationModule;

