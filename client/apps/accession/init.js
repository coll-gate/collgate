/**
 * @file init.js
 * @brief Accession module init entry point
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-05-26
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var AccessionModule = function() {
    this.name = "accession";
};

AccessionModule.prototype = {
    initialize: function(app, options) {
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
                console.warn("No translation found for the current language. Fallback to english language");
            }
        }

        //
        // main collections
        //

        var SelectOption = require('../main/renderers/selectoption');

        var AccessionSynonymTypeCollection = require('./collections/accessionsynonymtype');
        this.collections.accessionSynonymTypes = new AccessionSynonymTypeCollection();

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

        var BatchRouter = require('./routers/batch');
        this.routers.batch = new BatchRouter();

        //
        // defaults settings
        //

        // by default, accession list default columns to display
        app.setDefaultUserSetting('accessions_list_columns', [
            {name: 'glyph', width: 'auto', sort_by: null},
            {name: 'code', width: 'auto', sort_by: null},
            {name: 'name', width: 'auto', sort_by: 'asc'},
            {name: 'parent', width: 'auto', sort_by: null},
            {name: 'IPGRI_4.1.1', width: 'auto', sort_by: null},
            {name: 'MCPD_ORIGCTY', width: 'auto', sort_by: null}
        ]);

        // by default, batches list default columns to display
        app.setDefaultUserSetting('batches_list_columns', [
            {name: 'glyph', width: 'auto', sort_by: null},
            {name: 'name', width: 'auto', sort_by: 'asc'}
        ]);
    },

    start: function(options) {
        // nothing to do
    },

    stop: function(options) {

    }
};

module.exports = AccessionModule;

