/**
 * @file init.js
 * @brief Accession module init entry point
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-05-26
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

// style
require('./css/accession.css');

let AccessionModule = function () {
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
            i18next.default.addResources(session.language, 'default', require('./locale/' + session.language + '/default.json'));
        } catch (e) {
            console.warn("No translation found for the current language. Fallback to english language");
        }

        //
        // register the meta-model type of descriptors
        //

        let metaModelTypes = [
            'accession',
            'batch'
        ];

        for (let i = 0; i < metaModelTypes.length; ++i) {
            let moduleName = metaModelTypes[i].replace(/_/g, '').toLowerCase();
            app.descriptor.descriptorMetaModelTypes.registerElement(metaModelTypes[i], require('./descriptormetamodeltypes/' + moduleName));
        }

        //
        // batch action format types
        //

        let BatchActionFormatTypeManager = require('./actions/batchactionformattypemanager');
        this.actions = new BatchActionFormatTypeManager();

        // register the standard format type of descriptors
        let actions = [
            'creation',
            /* todo */
        ];

        for (let i = 0; i < actions.length; ++i) {
            let moduleName = actions[i].replace(/_/g, '').toLowerCase();
            this.actions.registerElement(actions[i], require('./actions/' + moduleName));
        }

        //
        // cache
        //

        app.main.cache.register('batch_action_types');

        //
        // main collections
        //

        let SelectOption = require('../main/renderers/selectoption');

        // @todo may be a cache collection or uses a cachefetcher for accession synonym type
        let EntitySynonymTypeCollection = require('../main/collections/entitysynonymtype');
        this.collections.accessionSynonymTypes = new EntitySynonymTypeCollection([], {
            target_model: 'accession.accession'});

        this.views.accessionSynonymTypes = new SelectOption({
            className: 'accession-synonym-type',
            collection: this.collections.accessionSynonymTypes
        });

        // @todo may be a cache collection or uses a cachefetcher for batch action type
        let BatchActionTypeCollection = require('./collections/batchactiontype');
        this.collections.batchActionTypes = new BatchActionTypeCollection();

        this.views.batchActionTypes = new SelectOption({
            className: 'batch-action-type',
            collection: this.collections.batchActionTypes
        });

        this.collections.conditionList = new Backbone.Collection();

        let BatchActionTypeFormatCollection = require('./collections/batchactiontypeformat');
        this.collections.batchActionTypeFormats = new BatchActionTypeFormatCollection();

        this.views.batchActionTypeFormats = new SelectOption({
            // sync: true,
            className: 'batch-action-type-format',
            collection: this.collections.batchActionTypeFormats,
        });

        //
        // controllers
        //

        let AccessionController = require('./controllers/accession');
        let BatchController = require('./controllers/batch');
        let AccessionPanelController = require('./controllers/accessionpanel');
        let BatchPanelController = require('./controllers/batchpanel');
        let BatchActionTypeController = require('./controllers/batchactiontype');

        this.controllers.accession = new AccessionController();
        this.controllers.batch = new BatchController();
        this.controllers.accessionpanel = new AccessionPanelController();
        this.controllers.batchpanel = new BatchPanelController();
        this.controllers.batchactiontype = new BatchActionTypeController();

        //
        // routers
        //

        let AccessionRouter = require('./routers/accession');
        this.routers.accession = new AccessionRouter();

        let BatchRouter = require('./routers/batch');
        this.routers.batch = new BatchRouter();

        let AccessionPanelRouter = require('./routers/accessionpanel');
        this.routers.accessionpanel = new AccessionPanelRouter();

        let BatchActionTypeRouter = require('./routers/batchactiontype');
        this.routers.batchactiontype = new BatchActionTypeRouter();

        let BatchPanelRouter = require('./routers/batchpanel');
        this.routers.batchpanel = new BatchPanelRouter();
    },

    start: function (app, options) {
        // nothing to do
    },

    stop: function (app, options) {

    }
};

module.exports = AccessionModule;
