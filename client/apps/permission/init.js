/**
 * @file init.js
 * @brief Permission module init entry point
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-05-26
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Marionette = require('backbone.marionette');

var PermissionModule = function() {
    this.name = "permission";
};

PermissionModule.prototype = {
    initialize: function(app, options) {
        this.models = {};
        this.collections = {};
        this.views = {};
        this.routers = {};
        this.controllers = {};

        try {
            i18next.default.addResources(session.language, 'default', require('./locale/' + session.language + '/default.json'));
        } catch (e) {
            console.warn("No translation found for the current language. Fallback to english language");
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
    },

    start: function(options) {
        // nothing to do
    },

    stop: function(options) {
    }
};

module.exports = PermissionModule;

