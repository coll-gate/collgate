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
var PermissionUserCollection = require('../collections/user');
var PermissionUserListView = require('../views/userlist');
var PermissionGroupCollection = require('../collections/group');
var PermissionGroupListView = require('../views/grouplist');
var AddPermissionType = require('../views/addpermissiontype');
var DefaultLayout = require('../../main/views/defaultlayout');
var TitleView = require('../../main/views/titleview');

var PermissionRouter = Marionette.AppRouter.extend({
    routes : {
        "app/permission/user/": "getUsers",
        "app/permission/user/:username/": "getPermissionsForUser",
        "app/permission/group/": "getGroups",
        "app/permission/group/:groupname/": "getPermissionsForGroup",
    },

    getUsers: function () {
        var userCollection = new PermissionUserCollection();

        var defaultLayout = new DefaultLayout({});
        ohgr.mainRegion.show(defaultLayout);

        defaultLayout.title.show(new TitleView({title: gettext("List of users")}));

        userCollection.fetch().then(function () {
            defaultLayout.content.show(new PermissionUserListView({collection : userCollection}));
        });
    },

    getPermissionsForUser: function(username) {
        var permissionsCollection = new PermissionCollection([], {username: username})

        var defaultLayout = new DefaultLayout({});
        ohgr.mainRegion.show(defaultLayout);

        defaultLayout.title.show(new TitleView({title: gettext("List of permissions for user") + " " + username}));

        permissionsCollection.fetch().then(function () {
            defaultLayout.content.show(new PermissionListView({collection : permissionsCollection}));
        });

        defaultLayout.bottom.show(new AddPermissionType({username: username}));
    },

    getGroups: function () {

    },

    getPermissionsForGroup: function(groupname) {
    },
});

module.exports = PermissionRouter;
