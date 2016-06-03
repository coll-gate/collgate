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
        if (user.language === "en") {
            var locale = require('./locale/en/LC_MESSAGES/default.po');
            gt.addTextdomain('default', locale);
        } else if (user.language === "fr") {
            locale = require('./locale/fr/LC_MESSAGES/default.po');
            gt.addTextdomain('default', locale);
        } else {  // default to english
            var locale = require('./locale/en/LC_MESSAGES/default.po');
            gt.addTextdomain('default', locale);
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
