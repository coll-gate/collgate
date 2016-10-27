/**
 * @file init.js
 * @brief Accession module init entry point
 * @author Frederic SCHERMA
 * @date 2016-05-26
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var AccessionModule = Marionette.Module.extend({

    initialize: function(moduleName, app, options) {
        Logger.time("Init accession module");

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

        Logger.timeEnd("Init accession module");
    },

    onStart: function(options) {
        Logger.time("Start accession module");

        var AccessionRouter = require('./routers/accession');
        this.routers.accession = new AccessionRouter();

        var DescriptorRouter = require('./routers/descriptor');
        this.routers.descriptor = new DescriptorRouter();

        var DescriptorModelRouter = require('./routers/descriptormodel');
        this.routers.descriptorModel = new DescriptorModelRouter();

        var DescriptorMetaModelRouter = require('./routers/descriptormetamodel');
        this.routers.descriptorMetaModel = new DescriptorMetaModelRouter();

        var DescriptorGroupCollection = require('./collections/descriptorgroup');
        this.collections.descriptorGroup = new DescriptorGroupCollection();

        Logger.timeEnd("Start accession module");
    },

    onStop: function(options) {

    },
});

// accession module
var accession = application.module("accession", AccessionModule);

module.exports = accession;
