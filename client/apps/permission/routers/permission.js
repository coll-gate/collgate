/**
 * @file permission.js
 * @brief Permission router
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-05-26
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let Marionette = require('backbone.marionette');

let PermissionCollection = require('../collections/permission');
let PermissionUserCollection = require('../collections/user');
let PermissionGroupCollection = require('../collections/group');
let PermissionGroupUserCollection = require('../collections/groupuser');

let PermissionListView = require('../views/permissionlist');
let PermissionAddView = require('../views/addpermission');
let PermissionUserListView = require('../views/userlist');
let PermissionGroupListView = require('../views/grouplist');
let PermissionGroupUserListView = require('../views/groupuserlist');
let PermissionGroupAddUserView = require('../views/addusergroup');
let PermissionAddGroupView = require('../views/addgroup');

let GroupModel = require('../models/group');

let DefaultLayout = require('../../main/views/defaultlayout');
let TitleView = require('../../main/views/titleview');
let ScrollingMoreView = require('../../main/views/scrollingmore');

let PermissionRouter = Marionette.AppRouter.extend({
    routes : {
        "app/permission/user/": "getUsers",
        "app/permission/user/username/:username/permission/": "getPermissionsForUser",
        "app/permission/group/": "getGroups",
        "app/permission/group/:group_id/permission/": "getPermissionsForGroup",
        "app/permission/group/:group_id/user/": "getUsersForGroup",
    },

    getUsers: function () {
        let userCollection = new PermissionUserCollection();

        let defaultLayout = new DefaultLayout({});
        application.main.showContent(defaultLayout);

        defaultLayout.showChildView('title', new TitleView({title: _t("List of users")}));

        userCollection.fetch().then(function () {
            let permissionUserList = new PermissionUserListView({collection : userCollection});

            defaultLayout.showChildView('content', permissionUserList);
            defaultLayout.showChildView('content-bottom', new ScrollingMoreView({targetView: permissionUserList}));
        });
    },

    getPermissionsForUser: function(username) {
        let permissionsCollection = new PermissionCollection([], {username: username});

        let defaultLayout = new DefaultLayout({});
        application.main.showContent(defaultLayout);

        defaultLayout.showChildView('title', new TitleView({title: _t("List of permissions for user"), object: username}));

        permissionsCollection.fetch().then(function () {
            let permissionListView = new PermissionListView({collection : permissionsCollection});

            defaultLayout.showChildView('content', permissionListView);
            defaultLayout.showChildView('content-bottom', new ScrollingMoreView({targetView: permissionListView}));

            if ($.inArray("auth.add_permission", permissionsCollection.perms) >= 0) {
                defaultLayout.showChildView('bottom', new PermissionAddView({collection : permissionsCollection}));
            }
        });
    },

    getGroups: function () {
        let groupCollection = new PermissionGroupCollection();

        let defaultLayout = new DefaultLayout({});
        application.main.showContent(defaultLayout);

        defaultLayout.showChildView('title', new TitleView({title: _t("List of groups")}));

        groupCollection.fetch().then(function () {
            let permissionGroupList = new PermissionGroupListView({collection : groupCollection});

            defaultLayout.showChildView('content', permissionGroupList);
            defaultLayout.showChildView('content-bottom', new ScrollingMoreView({targetView: permissionGroupList}));

            if ($.inArray("auth.add_group", groupCollection.perms) >= 0) {
                defaultLayout.showChildView('bottom', new PermissionAddGroupView({collection : groupCollection}));
            }
        });
    },

    getPermissionsForGroup: function(id) {
        let permissionsCollection = new PermissionCollection([], {group_id: id, is_group: true});

        let defaultLayout = new DefaultLayout({});
        window.application.main.showContent(defaultLayout);

        let group = new GroupModel({id: id});
        group.fetch().then(function() {
            defaultLayout.showChildView('title', new TitleView({
                title: _t("List of permissions for group"),
                model: group
            }));
        });

        permissionsCollection.fetch().then(function () {
            let permissionList = new PermissionListView({collection : permissionsCollection});

            defaultLayout.showChildView('content', permissionList);
            defaultLayout.showChildView('content-bottom', new ScrollingMoreView({targetView: permissionList}));

            if ($.inArray("auth.add_permission", permissionsCollection.perms) >= 0) {
                defaultLayout.showChildView('bottom', new PermissionAddView({collection : permissionsCollection}));
            }
        });
    },

    getUsersForGroup: function(id) {
        let userCollection = new PermissionGroupUserCollection([], {group_id: id});

        let defaultLayout = new DefaultLayout({});
        window.application.main.showContent(defaultLayout);

        let group = new GroupModel({id: id});
        group.fetch().then(function() {
            defaultLayout.showChildView('title', new TitleView({
                title: _t("List of users for group"),
                model: group
            }));
        });

        userCollection.fetch().then(function() {
            let permissionGroupUserList = new PermissionGroupUserListView({collection : userCollection});

            defaultLayout.showChildView('content', permissionGroupUserList);
            defaultLayout.showChildView('content-bottom', new ScrollingMoreView({targetView: permissionGroupUserList}));

            if ($.inArray("auth.change_group", userCollection.perms) >= 0) {
                defaultLayout.showChildView('bottom', new PermissionGroupAddUserView({collection : userCollection}));
            }
        });
    },
});

module.exports = PermissionRouter;
