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
        if (session.language === "fr") {
            i18next.addResources('fr', 'default', require('./locale/fr/LC_MESSAGES/default.json'));
        } else {  // default to english
            //i18next.addResources('en', 'default', require('./locale/en/LC_MESSAGES/default.json'));
        }

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
        
        Logger.timeEnd("Start descriptor module");
    },

    onStop: function(options) {

    },
});

// descriptor module
var descriptor = application.module("descriptor", DescriptorModule);

module.exports = descriptor;
