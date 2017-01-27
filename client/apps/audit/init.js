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

var AuditModule = function() {
    this.name = "audit";
};

AuditModule.prototype = {
    initialize: function (app, options) {
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

        //
        // controllers
        //

        var AuditController = require('./controllers/audit');
        this.controllers.audit = new AuditController();

        //
        // routers
        //

        var AuditRouter = require('./routers/audit');
        this.routers.audit = new AuditRouter();

        Logger.timeEnd("Init audit module");
    },

    start: function (options) {
        Logger.time("Start audit module");

        // nothing to do

        Logger.timeEnd("Start audit module");
    },

    stop: function (options) {

    }
};

module.exports = AuditModule;
