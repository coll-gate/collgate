/**
 * @file userlist.js
 * @brief Permission user list view
 * @author Frederic SCHERMA
 * @date 2016-05-30
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var PermissionUserModel = require('../models/user');
var PermissionUserView = require('../views/user');

var View = Marionette.CompositeView.extend({
    template: require("../templates/userlist.html"),  // "<div></div>",
    childView: PermissionUserView,
    childViewContainer: 'tbody.permission-user-list',

    ui: {
        //viewPermissions: 'td.view-permissions',
    },

    events: {
        //'click @ui.viewPermissions': 'viewUserPermissions',
    },

    initialize: function() {
        this.listenTo(this.collection, 'reset', this.render, this);
        //this.listenTo(this.collection, 'add', this.render, this);
        //this.listenTo(this.collection, 'remove', this.render, this);
        this.listenTo(this.collection, 'change', this.render, this);
    },

    onRender: function() {
    },

    /*viewUserPermissions: function (e) {
        var username = e.target.getAttribute('value');
        Backbone.history.navigate("app/permission/user/" + username + "/", {trigger: true});
    },*/
});

module.exports = View;
