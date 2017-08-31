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

        // @todo must be cached globally
        var ClassificationRankCollection = require('./collections/classificationrank');
        this.collections.classificationRanks = new ClassificationRankCollection([], {classification_id: 7});

        this.views.classificationRanks = new SelectOption({
            className: "classification-rank",
            collection: this.collections.classificationRanks
        });

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
        // routers
        //

        var ClassificationEntryRouter = require('./routers/classificationentry');
        this.routers.classificationEntry = new ClassificationEntryRouter();

        var ClassificationEntryCollection = require('./collections/classificationentry');
        this.collections.classificationEntries = new ClassificationEntryCollection();
    },

    start: function(options) {
        // nothing to do
    },

    stop: function(options) {

    }
};

module.exports = ClassificationModule;
