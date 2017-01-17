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

var AccessionModule = Marionette.Module.extend({

    initialize: function(moduleName, app, options) {
        Logger.time("Init accession module");

        this.models = {};
        this.collections = {};
        this.views = {};
        this.routers = {};
        this.controllers = {};

        // i18n
        try {
            i18next.addResources(session.language, 'default', require('./locale/' + session.language + '/LC_MESSAGES/default.json'));
        } catch (e) {
            console.warning("No translation found for the current language. Fallback to english language");
        };

        Logger.timeEnd("Init accession module");
    },

    onStart: function(options) {
        Logger.time("Start accession module");

        var SelectOptionItemView = require('../main/views/selectoptionitemview');

        var AccessionSynonymTypeCollection = require('./collections/accessionsynonymtype');
        this.collections.accessionSynonymTypes = new AccessionSynonymTypeCollection();

        this.views.accessionSynonymTypes = new SelectOptionItemView({
            className: 'accession-synonym-type',
            collection: this.collections.accessionSynonymTypes,
        });

        var AccessionRouter = require('./routers/accession');
        this.routers.accession = new AccessionRouter();

        var AccessionController = require('./controllers/accession');
        this.controllers.accession = new AccessionController();

        Logger.timeEnd("Start accession module");
    },

    onStop: function(options) {

    },
});

// accession module
var accession = application.module("accession", AccessionModule);

module.exports = accession;
