/**
 * @file init.js
 * @brief Accession module init entry point
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-05-26
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var AccessionModule = function () {
    this.name = "accession";
};

AccessionModule.prototype = {
    initialize: function (app, options) {
        this.models = {};
        this.collections = {};
        this.views = {};
        this.routers = {};
        this.controllers = {};

        try {
            i18next.default.addResources(session.language, 'default', require('./locale/' + session.language + '/LC_MESSAGES/default.json'));
        } catch (e) {
            console.warn("No translation found for the current language. Fallback to english language");
        }

        // register the meta-model type of descriptors
        var metaModelTypes = [
            'accession',
            'batch'
        ];

        for (var i = 0; i < metaModelTypes.length; ++i) {
            var moduleName = metaModelTypes[i].replace(/_/g, '').toLowerCase();
            app.descriptor.descriptorMetaModelTypes.registerElement(metaModelTypes[i], require('./descriptormetamodeltypes/' + moduleName));
        }

        //
        // main collections
        //

        var SelectOption = require('../main/renderers/selectoption');

        var EntitySynonymTypeCollection = require('../main/collections/entitysynonymtype');
        this.collections.accessionSynonymTypes = new EntitySynonymTypeCollection([], {
            target_model: 'accession.accession'});

        this.views.accessionSynonymTypes = new SelectOption({
            className: 'accession-synonym-type',
            collection: this.collections.accessionSynonymTypes
        });

        var BatchActionTypeCollection = require('./collections/batchactiontype');
        this.collections.batchActionTypes = new BatchActionTypeCollection();

        this.views.batchActionTypes = new SelectOption({
            className: 'batch-action-type',
            collection: this.collections.batchActionTypes
        });

        this.collections.conditionList = new Backbone.Collection();

        //
        // controllers
        //

        var AccessionController = require('./controllers/accession');
        var BatchController = require('./controllers/batch');
        var PanelController = require('./controllers/panel');
        this.controllers.accession = new AccessionController();
        this.controllers.batch = new BatchController();
        this.controllers.panel = new PanelController();

        //
        // routers
        //

        var AccessionRouter = require('./routers/accession');
        this.routers.accession = new AccessionRouter();

        var BatchRouter = require('./routers/batch');
        this.routers.batch = new BatchRouter();

        var PanelRouter = require('./routers/panel');
        this.routers.panel = new PanelRouter();

    },

    start: function (options) {
        // nothing to do
    },

    stop: function (options) {

    }
};

module.exports = AccessionModule;
