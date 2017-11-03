/**
 * @file descriptortypelistalt.js
 * @brief Alternative list of types of descriptors for a group view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-10-14
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let AdvancedTable = require('../../main/views/advancedtable');
let DescriptorTypeAltView = require('../views/descriptortypealt');

let View = AdvancedTable.extend({
    template: require("../templates/descriptortypelistalt.html"),
    className: "object descriptor-type-list advanced-table-container",
    childView: DescriptorTypeAltView,
    childViewContainer: 'tbody.descriptor-type-list',

    ui: {
        'table': 'table.table'
    },

    events: {
    },

    initialize: function() {
        View.__super__.initialize.apply(this);

        this.listenTo(this.collection, 'reset', this.render, this);
    }
});

module.exports = View;

