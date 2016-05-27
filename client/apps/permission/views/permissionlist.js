/**
 * @file permissionlist.js
 * @brief Permission list view
 * @author Frederic SCHERMA
 * @date 2016-05-26
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var PermissionModel = require('../models/permission');
var PermissionView = require('../views/permission');

var PermissionListView = Marionette.CollectionView.extend({
    tagName: "div",
    template: "<div></div>",
    className: "permission-list",
    childView: PermissionView,

    ui: {
        remove_permission: 'span.remove-permission',
    },

    events: {
        'click @ui.delete_permission': 'removePermission',
    },

    initialize: function() {
        this.listenTo(this.collection, 'reset', this.render, this);
        //this.listenTo(this.collection, 'add', this.render, this);
        //this.listenTo(this.collection, 'remove', this.render, this);
        //this.listenTo(this.collection, 'change', this.render, this);
    },

    onRender: function() {
    },

    removePermission: function (e) {
        var permission = e.target.getAttribute("permission");
        var model = e.target.getAttribute("model");
        var object = e.target.getAttribute("object");
        var username = e.target.getAttribute("username");
        Backbone.history.navigate("app/permission/user/" + username + "/", {trigger: true});
    },
});

module.exports = PermissionListView;
