/**
 * @file init.js
 * @brief Descriptor module init entry point
 * @author Frederic SCHERMA
 * @date 2016-05-26
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var DescriptorModule = Marionette.Module.extend({

    initialize: function(moduleName, app, options) {
        Logger.time("Init descriptor module");

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

        Logger.timeEnd("Init descriptor module");
    },

    onStart: function(options) {
        Logger.time("Start descriptor module");

        var DescriptorRouter = require('./routers/descriptor');
        this.routers.descriptor = new DescriptorRouter();

        var DescriptorModelRouter = require('./routers/descriptormodel');
        this.routers.descriptorModel = new DescriptorModelRouter();

        var DescriptorMetaModelRouter = require('./routers/descriptormetamodel');
        this.routers.descriptorMetaModel = new DescriptorMetaModelRouter();

        var DescriptorGroupCollection = require('./collections/descriptorgroup');
        this.collections.descriptorGroup = new DescriptorGroupCollection();

        var SelectOptionItemView = require('../main/views/selectoptionitemview');

        var DescribableCollection = require('./collections/describable');
        this.collections.describables = new DescribableCollection();

        this.views.describables = new SelectOptionItemView({
            className: 'describable',
            collection: this.collections.describables,
        });

        var ConditionCollection = require('./collections/condition');
        this.collections.conditions = new ConditionCollection();

        this.views.conditions = new SelectOptionItemView({
            className: 'condition',
            collection: this.collections.conditions,
        });

        var FormatTypeCollection = require('./collections/formattype');
        this.collections.formatTypes = new FormatTypeCollection();

        this.views.formatTypes = new SelectOptionItemView({
            sync: true,
            className: 'format-type',
            collection: this.collections.formatTypes,
        });

        var FormatUnitCollection = require('./collections/formatunit');
        this.collections.formatUnits = new FormatUnitCollection();

        this.views.formatUnits = new SelectOptionItemView({
            sync: true,
            className: 'format-unit',
            collection: this.collections.formatUnits,
        });
        
        Logger.timeEnd("Start descriptor module");
    },

    onStop: function(options) {

    },
});

// descriptor module
var descriptor = application.module("descriptor", DescriptorModule);

module.exports = descriptor;
