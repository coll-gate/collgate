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
        this.models = {};
        this.collections = {};
        this.views = {};
        this.routers = {};
        this.controllers = {};

        //var PermissionController = require('./controllers/permission');
        //this.controllers.Permission = new PermissionController();
    },

    onStart: function(options) {
        var PermissionRouter = require('./routers/permission');
        this.routers.permission = new PermissionRouter();
    },

    onStop: function(options) {

    },
});

// permission module
var permission = ohgr.module("permission", PermissionModule);

module.exports = permission;
