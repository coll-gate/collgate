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
            window.i18next.default.addResources(
                window.session.language, 'default', require('./locale/' + session.language + '/default.json'));
        } catch (e) {
            console.warn("No translation found for the current language. Fallback to english language");
        }

        //
        // register the layout type of descriptors
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
        // action format types
        //

        let ActionFormatTypeManager = require('./actionstep/actionstepformatmanager');
        this.actions = new ActionFormatTypeManager();

        // register the standard format type of descriptors
        let actions = [
            'accession_list',
            'accession_refinement',
            'accessionconsumer_batchproducer',
            'batchconsumer_batchmodifier',
            'batchconsumer_batchproducer'
        ];

        for (let i = 0; i < actions.length; ++i) {
            let moduleName = actions[i].replace(/_/g, '').toLowerCase();
            this.actions.registerElement(actions[i], require('./actionstep/' + moduleName));
        }

        //
        // cache
        //

        app.main.cache.register('action_types');

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
        let ActionTypeCollection = require('./collections/actiontype');
        this.collections.actionTypes = new ActionTypeCollection();

        this.views.actionTypes = new SelectOption({
            className: 'action-type',
            collection: this.collections.actionTypes
        });

        this.collections.conditionList = new Backbone.Collection();

        let ActionStepFormatCollection = require('./collections/actionstepformat');
        this.collections.actionStepFormats = new ActionStepFormatCollection();

        this.views.actionStepFormats = new SelectOption({
            // sync: true,
            className: 'action-step-format',
            collection: this.collections.actionStepFormats,
        });

        //
        // controllers
        //

        let AccessionController = require('./controllers/accession');
        let BatchController = require('./controllers/batch');
        let AccessionPanelController = require('./controllers/accessionpanel');
        let BatchPanelController = require('./controllers/batchpanel');
        let ActionTypeController = require('./controllers/actiontype');
        let ActionController = require('./controllers/action');

        this.controllers.accession = new AccessionController();
        this.controllers.batch = new BatchController();
        this.controllers.accessionpanel = new AccessionPanelController();
        this.controllers.batchpanel = new BatchPanelController();
        this.controllers.actiontype = new ActionTypeController();
        this.controllers.action = new ActionController();

        //
        // routers
        //

        let AccessionRouter = require('./routers/accession');
        this.routers.accession = new AccessionRouter();

        let BatchRouter = require('./routers/batch');
        this.routers.batch = new BatchRouter();

        let AccessionPanelRouter = require('./routers/accessionpanel');
        this.routers.accessionpanel = new AccessionPanelRouter();

        let ActionTypeRouter = require('./routers/actiontype');
        this.routers.actiontype = new ActionTypeRouter();

        let ActionRouter = require('./routers/action');
        this.routers.action = new ActionRouter();

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
