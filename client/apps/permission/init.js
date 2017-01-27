/**
 * @file init.js
 * @brief Permission module init entry point
 * @author Frederic SCHERMA
 * @date 2016-05-26
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var PermissionModule = function() {
    this.name = "permission";
};

PermissionModule.prototype = {
    initialize: function(app, options) {
        Logger.time("Init permission module");

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
        // main collections
        //

        var SelectOption = require('../main/renderers/selectoption');

        var PermissionTypeCollection = require('./collections/permissiontype');
        this.collections.permissionType = new PermissionTypeCollection();

        this.views.permissionType = new SelectOption({
            className: 'permission-type',
            collection: this.collections.permissionType,
        });

        //
        // routers
        //

        var PermissionRouter = require('./routers/permission');
        this.routers.permission = new PermissionRouter();

        Logger.timeEnd("Init permission module");
    },

    start: function(options) {
        Logger.time("Start permission module");

        // nothing to do

        Logger.timeEnd("Start permission module");
    },

    stop: function(options) {
    }
};

module.exports = PermissionModule;
