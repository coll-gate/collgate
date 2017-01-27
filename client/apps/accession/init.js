/**
 * @file init.js
 * @brief Accession module init entry point
 * @author Frederic SCHERMA
 * @date 2016-05-26
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var AccessionModule = function() {
    this.name = "accession";
};

AccessionModule.prototype = {
    initialize: function(app, options) {
        Logger.time("Init accession module");

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
        // main collections
        //

        var SelectOptionItemView = require('../main/views/selectoptionitemview');

        var AccessionSynonymTypeCollection = require('./collections/accessionsynonymtype');
        this.collections.accessionSynonymTypes = new AccessionSynonymTypeCollection();

        this.views.accessionSynonymTypes = new SelectOptionItemView({
            className: 'accession-synonym-type',
            collection: this.collections.accessionSynonymTypes,
        });

        //
        // controllers
        //

        var AccessionController = require('./controllers/accession');
        this.controllers.accession = new AccessionController();

        //
        // routers
        //

        var AccessionRouter = require('./routers/accession');
        this.routers.accession = new AccessionRouter();

        Logger.timeEnd("Init accession module");
    },

    start: function(options) {
        Logger.time("Start accession module");

        // nothing to do

        Logger.timeEnd("Start accession module");
    },

    stop: function(options) {

    }
};

module.exports = AccessionModule;
