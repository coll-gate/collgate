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

var PermissionModule = Marionette.Module.extend({

    initialize: function(moduleName, app, options) {
        Logger.time("Init permission module");

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

        var SelectOptionItemView = require('../main/views/selectoptionitemview');

        var PermissionTypeCollection = require('./collections/permissiontype');
        this.collections.permissionType = new PermissionTypeCollection();

        this.views.permissionType = new SelectOptionItemView({
            className: 'permission-type',
            collection: this.collections.permissionType,
        });

        Logger.timeEnd("Init permission module");
    },

    onStart: function(options) {
        Logger.time("Start permission module");

        var PermissionRouter = require('./routers/permission');
        this.routers.permission = new PermissionRouter();

        Logger.timeEnd("Start permission module");
    },

    onStop: function(options) {
    },
});

// permission module
var permission = application.module("permission", PermissionModule);

module.exports = permission;
