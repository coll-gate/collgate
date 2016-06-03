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
        this.models = {};
        this.collections = {};
        this.views = {};
        this.routers = {};
        this.controllers = {};

        // i18n
        if (user.language === "fr") {
            gt.addTextdomain('default', require('./locale/fr/LC_MESSAGES/default.mo'));
        } else {  // default to english
            gt.addTextdomain('default', require('./locale/en/LC_MESSAGES/default.mo'));
        }
    },

    onStart: function(options) {
        // var AccessionRouter = require('./routers/accession');
        // this.routers.accession = new AccessionRouter();

        // var AccessionCollection = require('./collections/accession');
        // this.collections.accession = new AccessionCollection();
    },

    onStop: function(options) {

    },
});

// accession module
var accession = ohgr.module("accession", AccessionModule);

module.exports = accession;
