/**
 * @file init.js
 * @brief Audit module init entry point
 * @author Frederic SCHERMA
 * @date 2016-06-24
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var AuditModule = Marionette.Module.extend({

    initialize: function(moduleName, app, options) {
        this.models = {};
        this.collections = {};
        this.views = {};
        this.routers = {};
        this.controllers = {};

        // i18n
        if (user.language === "fr") {
            i18next.addResources('fr', 'default', require('./locale/fr/LC_MESSAGES/default.json'));
            //gt.addTextdomain('default', require('./locale/fr/LC_MESSAGES/default.mo'));
        } else {  // default to english
            i18next.addResources('en', 'default', require('./locale/en/LC_MESSAGES/default.json'));
            //gt.addTextdomain('default', require('./locale/en/LC_MESSAGES/default.mo'));
        }
    },

    onStart: function(options) {
        // var AuditRouter = require('./routers/audit');
        // this.routers.audit = new AuditRouter();

        var AuditController = require('./controllers/audit');
        this.controllers.audit = new AuditController();
    },

    onStop: function(options) {

    },
});

// audit module
var audit = ohgr.module("audit", AuditModule);

module.exports = audit;
