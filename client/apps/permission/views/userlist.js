/**
 * @file userlist.js
 * @brief Permission user list view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-05-30
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let PermissionUserView = require('../views/user');
let AdvancedTable = require('../../main/views/advancedtable');

let View = AdvancedTable.extend({
    template: require("../templates/userlist.html"),
    className: "permission-user-list advanced-table-container",
    childView: PermissionUserView,
    childViewContainer: 'tbody.permission-user-list',

    initialize: function() {
        View.__super__.initialize.apply(this);

        this.listenTo(this.collection, 'reset', this.render, this);
    }
});

module.exports = View;
