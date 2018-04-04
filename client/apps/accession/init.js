/**
 * @file init.js
 * @brief Accession module init entry point
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-05-26
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Backbone = require('backbone');

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
                window.session.language, 'default', require('./locale/' + window.session.language + '/default.json'));
        } catch (e) {
            console.warn("No translation found for the current language. Fallback to english language");
        }

        //
        // register the layout type of descriptors
        //

        let layoutTypes = [
            'accession',
            'batch'
        ];

        for (let i = 0; i < layoutTypes.length; ++i) {
            let moduleName = layoutTypes[i].replace(/_/g, '').toLowerCase();
            app.descriptor.layoutTypes.registerElement(layoutTypes[i], require('./layouttypes/' + moduleName));
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

        app.main.cache.register('accession');

        //
        // main collections
        //

        let SelectOption = require('../main/renderers/selectoption');

        // cached and countable collection
        let ActionTypeCollection = require('./collections/actiontype');
        this.collections.actionTypes = new ActionTypeCollection([], {cacheable: true});

        this.views.actionTypes = new SelectOption({
            className: 'action-type',
            collection: this.collections.actionTypes
        });

        // global collection, not cached, static by server
        this.collections.conditionList = new Backbone.Collection();

        // global collection, not cached, static by server
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

        let BatchPanelRouter = require('./routers/batchpanel');
        this.routers.batchpanel = new BatchPanelRouter();

        let ActionTypeRouter = require('./routers/actiontype');
        this.routers.actiontype = new ActionTypeRouter();

        let ActionRouter = require('./routers/action');
        this.routers.action = new ActionRouter();

        let StorageLocationRouter = require('./routers/storagelocation');
        this.routers.storagelocation = new StorageLocationRouter();

    },

    start: function (app, options) {
        // nothing to do
    },

    stop: function (app, options) {

    }
};

module.exports = AccessionModule;
