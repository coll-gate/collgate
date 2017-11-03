/**
 * @file descriptorgrouplist.js
 * @brief List of groups of types of descriptors view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-07-20
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let DescriptorGroupView = require('../views/descriptorgroup');
let AdvancedTable = require('../../main/views/advancedtable');

let View = AdvancedTable.extend({
    template: require("../templates/descriptorgrouplist.html"),
    className: "object descriptor-group-list advanced-table-container",
    childView: DescriptorGroupView,
    childViewContainer: 'tbody.descriptor-group-list',

    defaultSortBy: ['name'],

    initialize: function() {
        View.__super__.initialize.apply(this);

        this.listenTo(this.collection, 'reset', this.render, this);
    }
});

module.exports = View;
