/**
 * @file groupuserlist.js
 * @brief Permission user list from a group view
 * @author Frederic SCHERMA
 * @date 2016-06-09
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var PermissionGroupUserModel = require('../models/groupuser');
var PermissionGroupUserView = require('../views/groupuser');

var View = Marionette.CompositeView.extend({
    template: require("../templates/groupuserlist.html"),
    childView: PermissionGroupUserView,
    childViewContainer: 'tbody.group-user-list',

    initialize: function() {
        this.listenTo(this.collection, 'reset', this.render, this);
        //this.listenTo(this.collection, 'add', this.render, this);
        //this.listenTo(this.collection, 'remove', this.render, this);
        this.listenTo(this.collection, 'change', this.render, this);
    },
});

module.exports = View;
