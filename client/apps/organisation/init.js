/**
 * @file init.js
 * @brief Organisation module init entry point
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-02-27
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let OrganisationModule = function() {
    this.name = "organisation";
};

OrganisationModule.prototype = {
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
        // collections
        //

        let SelectOption = require('../main/renderers/selectoption');

        // @todo may be a cache collection or uses a cachefetcher for organisationtype
        let OrganisationTypeCollection = require('./collections/organisationtype');
        this.collections.organisationTypes = new OrganisationTypeCollection();

        this.views.organisationTypes = new SelectOption({
            className: 'organisation-type',
            collection: this.collections.organisationTypes
        });

        //
        // controllers
        //

        let OrganisationController = require('./controllers/organisation');
        this.controllers.organisation = new OrganisationController();

        let EstablishmentController = require('./controllers/establishment');
        this.controllers.establishment = new EstablishmentController();

        let PersonController = require('./controllers/person');
        this.controllers.person = new PersonController();

        let ConservatoryController = require('./controllers/conservatory');
        this.controllers.conservatory = new ConservatoryController();

        //
        // routers
        //

        let OrganisationRouter = require('./routers/organisation');
        this.routers.organisation = new OrganisationRouter();

        let EstablishmentRouter = require('./routers/establishment');
        this.routers.establishment = new EstablishmentRouter();

        let PersonRouter = require('./routers/person');
        this.routers.person = new PersonRouter();

        let ConservatoryRouter = require('./routers/conservatory');
        this.routers.conservatory = new ConservatoryRouter();
    },

    start: function(app, options) {
        // nothing to do
    },

    stop: function(app, options) {

    }
};

module.exports = OrganisationModule;
