/**
 * @file init.js
 * @brief Descriptor module init entry point
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-05-26
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

// style
require('./css/descriptor.css');

let DescriptorModule = function() {
    this.name = "descriptor";
};

DescriptorModule.prototype = {
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
        // main collections
        //

        let SelectOption = require('../main/renderers/selectoption');

        let DescribableCollection = require('./collections/describable');
        this.collections.describables = new DescribableCollection();

        this.views.describables = new SelectOption({
            className: 'describable',
            collection: this.collections.describables,
        });

        let ConditionCollection = require('./collections/condition');
        this.collections.conditions = new ConditionCollection();

        this.views.conditions = new SelectOption({
            className: 'condition',
            collection: this.collections.conditions,
        });

        let FormatTypeCollection = require('./collections/formattype');
        this.collections.formatTypes = new FormatTypeCollection();

        this.views.formatTypes = new SelectOption({
            // sync: true,
            className: 'format-type',
            collection: this.collections.formatTypes,
        });

        let FormatUnitCollection = require('./collections/formatunit');
        this.collections.formatUnits = new FormatUnitCollection();

        this.views.formatUnits = new SelectOption({
            // sync: true,
            className: 'format-unit',
            collection: this.collections.formatUnits,
        });

        //
        // descriptor format types
        //

        this.format_with_value_list = [
            'enum_single',
            'enum_pair',
            'enum_ordinal'
        ];

        let DescriptorFormatTypeManager = require('./widgets/descriptorformattypemanager');
        this.widgets = new DescriptorFormatTypeManager();

        // register the standard format type of descriptors
        let widgets = [
            'boolean',
            'numeric',
            'numeric_range',
            'ordinal',
            'string',
            'imprecise_date',
            'date',
            'time',
            'datetime',
            'entity',
            'enum_single',
            'enum_pair',
            'enum_ordinal',
            'layout',
            'user'
        ];

        for (let i = 0; i < widgets.length; ++i) {
            let moduleName = widgets[i].replace(/_/g, '').toLowerCase();
            this.widgets.registerElement(widgets[i], require('./widgets/' + moduleName));
        }

        //
        // descriptor layout types
        //

        let DescriptorMetaModelTypeManager = require('./descriptormetamodeltypes/descriptormetamodeltypemanager');
        this.descriptorMetaModelTypes = new DescriptorMetaModelTypeManager();

        //
        // cache
        //

        app.main.cache.register('descriptors');
        app.main.cache.register('layout');
        app.main.cache.register('entity_columns');

        let DescriptorMetaModelCacheFetcher = require('./utils/descriptormetamodelcachefetcher');
        app.main.cache.registerFetcher(new DescriptorMetaModelCacheFetcher());

        let DescriptorCacheFetcher = require('./utils/descriptorcachefetcher');
        app.main.cache.registerFetcher(new DescriptorCacheFetcher());

        let ColumnCacheFetcher = require('./utils/columncachefetcher');
        app.main.cache.registerFetcher(new ColumnCacheFetcher());

        //
        // routers
        //

        let DescriptorRouter = require('./routers/descriptor');
        this.routers.descriptor = new DescriptorRouter();

        let LayoutRouter = require('./routers/layout');
        this.routers.descriptorMetaModel = new LayoutRouter();

        let DescriptorGroupCollection = require('./collections/descriptor');
        this.collections.descriptorGroup = new DescriptorGroupCollection();

        //
        // controllers
        //

        let DescriptorController = require('./controllers/descriptor');
        this.controllers.descriptor = new DescriptorController();

    },

    start: function(app, options) {
        // nothing to do
    },

    stop: function(app, options) {

    }
};

module.exports = DescriptorModule;
