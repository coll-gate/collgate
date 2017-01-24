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
        Logger.time("Init audit module");

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
                console.warning("No translation found for the current language. Fallback to english language");
            }
        }
        
        Logger.timeEnd("Init audit module");
    },

    onStart: function(options) {
        Logger.time("Start audit module");
        
        var AuditController = require('./controllers/audit');
        this.controllers.audit = new AuditController();

        var AuditRouter = require('./routers/audit');
        this.routers.audit = new AuditRouter();

        Logger.timeEnd("Start audit module");
    },

    onStop: function(options) {

    },
});

// audit module
var audit = application.module("audit", AuditModule);

module.exports = audit;
