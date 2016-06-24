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

        // i18n
        if (user.language === "fr") {
            i18next.addResources('fr', 'default', require('./locale/fr/LC_MESSAGES/default.json'));
            //gt.addTextdomain('default', require('./locale/fr/LC_MESSAGES/default.mo'));
        } else {  // default to english
            i18next.addResources('en', 'default', require('./locale/en/LC_MESSAGES/default.json'));
            //gt.addTextdomain('default', require('./locale/en/LC_MESSAGES/default.mo'));
        }

        var SelectOptionItemView = require('../main/views/selectoptionitemview');

        var PermissionTypeCollection = require('./collections/permissiontype');
        this.collections.permissionType = new PermissionTypeCollection();

        this.views.permissionType = new SelectOptionItemView({
            className: 'permission-type',
            collection: this.collections.permissionType,
        });
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
