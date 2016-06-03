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
    template: require("../templates/userlist.html"),
    childView: PermissionUserView,
    childViewContainer: 'tbody.permission-user-list',

    initialize: function() {
        this.listenTo(this.collection, 'reset', this.render, this);
        //this.listenTo(this.collection, 'add', this.render, this);
        //this.listenTo(this.collection, 'remove', this.render, this);
        this.listenTo(this.collection, 'change', this.render, this);
    },

    onRender: function() {
    },
});

module.exports = View;
