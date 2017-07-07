/**
 * @file permission.js
 * @brief Permission router
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-05-26
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Marionette = require('backbone.marionette');

var PermissionCollection = require('../collections/permission');
var PermissionUserCollection = require('../collections/user');
var PermissionGroupCollection = require('../collections/group');
var PermissionGroupUserCollection = require('../collections/groupuser');

var PermissionListView = require('../views/permissionlist');
var PermissionAddView = require('../views/addpermission');
var PermissionUserListView = require('../views/userlist');
var PermissionGroupListView = require('../views/grouplist');
var PermissionGroupUserListView = require('../views/groupuserlist');
var PermissionGroupAddUserView = require('../views/addusergroup');
var PermissionAddGroupView = require('../views/addgroup');

var GroupModel = require('../models/group');

var DefaultLayout = require('../../main/views/defaultlayout');
var TitleView = require('../../main/views/titleview');
var ScrollingMoreView = require('../../main/views/scrollingmore');

var PermissionRouter = Marionette.AppRouter.extend({
    routes : {
        "app/permission/user/": "getUsers",
        "app/permission/user/:username/permission/": "getPermissionsForUser",
        "app/permission/group/": "getGroups",
        "app/permission/group/:group_id/permission/": "getPermissionsForGroup",
        "app/permission/group/:group_id/user/": "getUsersForGroup",
    },

    getUsers: function () {
        var userCollection = new PermissionUserCollection();

        var defaultLayout = new DefaultLayout({});
        application.main.showContent(defaultLayout);

        defaultLayout.showChildView('title', new TitleView({title: gt.gettext("List of users")}));

        userCollection.fetch().then(function () {
            var permissionUserList = new PermissionUserListView({collection : userCollection});

            defaultLayout.showChildView('content', permissionUserList);
            defaultLayout.showChildView('content-bottom', new ScrollingMoreView({targetView: permissionUserList}));
        });
    },

    getPermissionsForUser: function(username) {
        var permissionsCollection = new PermissionCollection([], {username: username});

        var defaultLayout = new DefaultLayout({});
        application.main.showContent(defaultLayout);

        defaultLayout.showChildView('title', new TitleView({title: gt.gettext("List of permissions for user"), object: username}));

        permissionsCollection.fetch().then(function () {
            var permissionListView = new PermissionListView({collection : permissionsCollection});

            defaultLayout.showChildView('content', permissionListView);
            defaultLayout.showChildView('content-bottom', new ScrollingMoreView({targetView: permissionListView}));

            if ($.inArray("auth.add_permission", permissionsCollection.perms) >= 0) {
                defaultLayout.showChildView('bottom', new PermissionAddView({collection : permissionsCollection}));
            }
        });
    },

    getGroups: function () {
        var groupCollection = new PermissionGroupCollection();

        var defaultLayout = new DefaultLayout({});
        application.main.showContent(defaultLayout);

        defaultLayout.showChildView('title', new TitleView({title: gt.gettext("List of groups")}));

        groupCollection.fetch().then(function () {
            var permissionGroupList = new PermissionGroupListView({collection : groupCollection});

            defaultLayout.showChildView('content', permissionGroupList);
            defaultLayout.showChildView('content-bottom', new ScrollingMoreView({targetView: permissionGroupList}));

            if ($.inArray("auth.add_group", groupCollection.perms) >= 0) {
                defaultLayout.showChildView('bottom', new PermissionAddGroupView({collection : groupCollection}));
            }
        });
    },

    getPermissionsForGroup: function(id) {
        var permissionsCollection = new PermissionCollection([], {group_id: id, is_group: true});

        var defaultLayout = new DefaultLayout({});
        application.main.showContent(defaultLayout);

        var group = new GroupModel({id: id});
        group.fetch().then(function() {
            defaultLayout.showChildView('title', new TitleView({
                title: gt.gettext("List of permissions for group"),
                object: group.get('name')
            }));
        });

        permissionsCollection.fetch().then(function () {
            var permissionList = new PermissionListView({collection : permissionsCollection});

            defaultLayout.showChildView('content', permissionList);
            defaultLayout.showChildView('content-bottom', new ScrollingMoreView({targetView: permissionList}));

            if ($.inArray("auth.add_permission", permissionsCollection.perms) >= 0) {
                defaultLayout.showChildView('bottom', new PermissionAddView({collection : permissionsCollection}));
            }
        });
    },

    getUsersForGroup: function(id) {
        var userCollection = new PermissionGroupUserCollection([], {group_id: id});

        var defaultLayout = new DefaultLayout({});
        application.main.showContent(defaultLayout);

        var group = new GroupModel({id: id});
        group.fetch().then(function() {
            defaultLayout.showChildView('title', new TitleView({
                title: gt.gettext("List of users for group"),
                object: group.get('name')
            }));
        });

        userCollection.fetch().then(function() {
            var permissionGroupUserList = new PermissionGroupUserListView({collection : userCollection});

            defaultLayout.showChildView('content', permissionGroupUserList);
            defaultLayout.showChildView('content-bottom', new ScrollingMoreView({targetView: permissionGroupUserList}));

            if ($.inArray("auth.change_group", userCollection.perms) >= 0) {
                defaultLayout.showChildView('bottom', new PermissionGroupAddUserView({collection : userCollection}));
            }
        });
    },
});

module.exports = PermissionRouter;
