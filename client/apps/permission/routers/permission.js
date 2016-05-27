/**
 * @file permission.js
 * @brief Permission router
 * @author Frederic SCHERMA
 * @date 2016-05-26
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var PermissionCollection = require('../collections/permission');
var PermissionListView = require('../views/permissionlist');
var DefaultLayout = require('../../main/views/defaultlayout');
var TitleView = require('../../main/views/titleview');

var PermissionRouter = Marionette.AppRouter.extend({
    routes : {
        "app/permission/user/:username/": "getPermissionsForUser",
    },

    getPermissionsForUser: function(username) {
        var permissionsCollection = new PermissionCollection([], {username: username})

        var defaultLayout = new DefaultLayout({});
        ohgr.mainRegion.show(defaultLayout);

        defaultLayout.title.show(new TitleView({title: gettext("List of permissions for user") + " " + username}));

        permissionsCollection.fetch().then(function () {
            defaultLayout.content.show(new PermissionListView({collection : permissionsCollection}));
        });
    },

    getAddPermissionToUser: function () {

    },
});

module.exports = PermissionRouter;
