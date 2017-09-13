/**
 * @file init.js
 * @brief Classification module init entry point
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-04-12
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var ClassificationModule = function() {
    this.name = "classification";
};

ClassificationModule.prototype = {
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
        // main collections
        //

        var SelectOption = require('../main/renderers/selectoption');

        var CollectionEntrySynonymTypeCollection = require('./collections/classificationentrysynonymtype');
        this.collections.classificationEntrySynonymTypes = new CollectionEntrySynonymTypeCollection();

        this.views.classificationEntrySynonymTypes = new SelectOption({
            className: 'classification-entry-synonym-type',
            collection: this.collections.classificationEntrySynonymTypes
        });

        //
        // controllers
        //

        var ClassificationEntryController = require('./controllers/classificationentry');
        this.controllers.classificationEntry = new ClassificationEntryController();

        //
        // cache
        //

        app.main.cache.register('classification');

        //
        // routers
        //

        var ClassificationRouter = require('./routers/classification');
        this.routers.classification = new ClassificationRouter();

        var ClassificationEntryRouter = require('./routers/classificationentry');
        this.routers.classificationEntry = new ClassificationEntryRouter();
    },

    start: function(options) {
        // nothing to do
    },

    stop: function(options) {

    }
};

module.exports = ClassificationModule;
