/**
 * @file auditlist.js
 * @brief Audit list view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-06-24
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let AuditView = require('../views/audit');
let AdvancedTable = require('../../main/views/advancedtable');

let View = AdvancedTable.extend({
    template: require("../templates/auditlist.html"),
    className: "object audit-list advanced-table-container",
    childView: AuditView,
    childViewContainer: 'tbody.audit-list',

    initialize: function() {
        View.__super__.initialize.apply(this);

        this.listenTo(this.collection, 'reset', this.render, this);
        // this.listenTo(this.collection, 'change', this.render, this);
    },
});

module.exports = View;
