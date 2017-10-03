/**
 * @file grouplist.js
 * @brief Permission group list view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-06-02
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var PermissionGroupView = require('../views/group');
var AdvancedTable = require('../../main/views/advancedtable');

var View = AdvancedTable.extend({
    template: require("../templates/grouplist.html"),
    className: "permission-group-list advanced-table-container",
    childView: PermissionGroupView,
    childViewContainer: 'tbody.permission-group-list',

    initialize: function() {
        View.__super__.initialize.apply(this);

        this.listenTo(this.collection, 'reset', this.render, this);
    }
});

module.exports = View;
