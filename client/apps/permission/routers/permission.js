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
var PermissionAddView = require('../views/addpermission');
var PermissionUserCollection = require('../collections/user');
var PermissionUserListView = require('../views/userlist');
var PermissionGroupCollection = require('../collections/group');
var PermissionGroupListView = require('../views/grouplist');
var PermissionGroupUserCollection = require('../collections/groupuser');
var PermissionGroupUserListView = require('../views/groupuserlist');
var PermissionGroupAddUserView = require('../views/addusergroup');
var PermissionAddGroupView = require('../views/addgroup');
var DefaultLayout = require('../../main/views/defaultlayout');
var TitleView = require('../../main/views/titleview');

var PermissionRouter = Marionette.AppRouter.extend({
    routes : {
        "app/permission/user/": "getUsers",
        "app/permission/user/:username/permission/": "getPermissionsForUser",
        "app/permission/group/": "getGroups",
        "app/permission/group/:groupname/permission/": "getPermissionsForGroup",
        "app/permission/group/:groupname/user/": "getUsersForGroup",
    },

    getUsers: function () {
        var userCollection = new PermissionUserCollection();

        var defaultLayout = new DefaultLayout({});
        ohgr.mainRegion.show(defaultLayout);

        defaultLayout.title.show(new TitleView({title: gt.gettext("List of users")}));

        userCollection.fetch().then(function () {
            defaultLayout.content.show(new PermissionUserListView({collection : userCollection}));
        });
    },

    getPermissionsForUser: function(username) {
        var permissionsCollection = new PermissionCollection([], {name: username})

        var defaultLayout = new DefaultLayout({});
        ohgr.mainRegion.show(defaultLayout);

        defaultLayout.title.show(new TitleView({title: gt.gettext("List of permissions for user") + " " + username}));

        permissionsCollection.fetch().then(function () {
            defaultLayout.content.show(new PermissionListView({collection : permissionsCollection}));

            if ($.inArray("auth.add_permission", permissionsCollection.perms) >= 0) {
                defaultLayout.bottom.show(new PermissionAddView({collection : permissionsCollection}));
            }
        });
    },

    getGroups: function () {
        var groupCollection = new PermissionGroupCollection();

        var defaultLayout = new DefaultLayout({});
        ohgr.mainRegion.show(defaultLayout);

        defaultLayout.title.show(new TitleView({title: gt.gettext("List of groups")}));

        groupCollection.fetch().then(function () {
            defaultLayout.content.show(new PermissionGroupListView({collection : groupCollection}));

            if ($.inArray("auth.add_group", groupCollection.perms) >= 0) {
                defaultLayout.bottom.show(new PermissionAddGroupView({collection : groupCollection}));
            }
        });
    },

    getPermissionsForGroup: function(name) {
        var permissionsCollection = new PermissionCollection([], {name: name, is_group: true})

        var defaultLayout = new DefaultLayout({});
        ohgr.mainRegion.show(defaultLayout);

        defaultLayout.title.show(new TitleView({title: gt.gettext("List of permissions for group") + " " + name}));

        permissionsCollection.fetch().then(function () {
            defaultLayout.content.show(new PermissionListView({collection : permissionsCollection}));

            if ($.inArray("auth.add_permission", permissionsCollection.perms) >= 0) {
                defaultLayout.bottom.show(new PermissionAddView({collection : permissionsCollection}));
            }
        });
    },

    getUsersForGroup: function(name) {
        var userCollection = new PermissionGroupUserCollection([], {name: name});

        var defaultLayout = new DefaultLayout({});
        ohgr.mainRegion.show(defaultLayout);

        defaultLayout.title.show(new TitleView({title: gt.gettext("List of users for group") + " " + name}));

        userCollection.fetch().then(function () {
            defaultLayout.content.show(new PermissionGroupUserListView({collection : userCollection}));

            if ($.inArray("auth.change_group", userCollection.perms) >= 0) {
                defaultLayout.bottom.show(new PermissionGroupAddUserView({collection : userCollection}));
            }
        });
    },
});

module.exports = PermissionRouter;
