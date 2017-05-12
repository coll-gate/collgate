/**
 * @file groupuserlist.js
 * @brief Permission user list from a group view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-06-09
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var PermissionGroupUserView = require('../views/groupuser');
var ScrollView = require('../../main/views/scroll');

var View = ScrollView.extend({
    template: require("../templates/groupuserlist.html"),
    className: "object group-user-list advanced-table-container",
    childView: PermissionGroupUserView,
    childViewContainer: 'tbody.group-user-list',

    initialize: function() {
        View.__super__.initialize.apply(this);

        this.listenTo(this.collection, 'reset', this.render, this);
    }
});

module.exports = View;
