/**
 * @file init.js
 * @brief Descriptor module init entry point
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-05-26
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Marionette = require('backbone.marionette');

// style
require('./css/descriptor.css');

var DescriptorModule = function() {
    this.name = "descriptor";
};

DescriptorModule.prototype = {
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

        var DescribableCollection = require('./collections/describable');
        this.collections.describables = new DescribableCollection();

        this.views.describables = new SelectOption({
            className: 'describable',
            collection: this.collections.describables,
        });

        var ConditionCollection = require('./collections/condition');
        this.collections.conditions = new ConditionCollection();

        this.views.conditions = new SelectOption({
            className: 'condition',
            collection: this.collections.conditions,
        });

        var FormatTypeCollection = require('./collections/formattype');
        this.collections.formatTypes = new FormatTypeCollection();

        this.views.formatTypes = new SelectOption({
            // sync: true,
            className: 'format-type',
            collection: this.collections.formatTypes,
        });

        var FormatUnitCollection = require('./collections/formatunit');
        this.collections.formatUnits = new FormatUnitCollection();

        this.views.formatUnits = new SelectOption({
            // sync: true,
            className: 'format-unit',
            collection: this.collections.formatUnits,
        });

        //
        // descriptor format types
        //

        var DescriptorFormatTypeManager = require('./widgets/descriptorformattypemanager');
        this.widgets = new DescriptorFormatTypeManager();

        // register the standard format type of descriptors
        var widgets = [
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
            'enum_ordinal'
        ];

        for (var i = 0; i < widgets.length; ++i) {
            var moduleName = widgets[i].replace('_', '').toLowerCase();
            this.widgets.registerElement(widgets[i], require('./widgets/' + moduleName));
        }

        //
        // routers
        //

        var DescriptorRouter = require('./routers/descriptor');
        this.routers.descriptor = new DescriptorRouter();

        var DescriptorModelRouter = require('./routers/descriptormodel');
        this.routers.descriptorModel = new DescriptorModelRouter();

        var DescriptorMetaModelRouter = require('./routers/descriptormetamodel');
        this.routers.descriptorMetaModel = new DescriptorMetaModelRouter();

        var DescriptorGroupCollection = require('./collections/descriptorgroup');
        this.collections.descriptorGroup = new DescriptorGroupCollection();
    },

    start: function(options) {
        // nothing to do
    },

    stop: function(options) {

    }
};

module.exports = DescriptorModule;
