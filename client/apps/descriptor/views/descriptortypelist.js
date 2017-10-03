/**
 * @file descriptortypelist.js
 * @brief List of types of descriptors for a group view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-07-21
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var AdvancedTable = require('../../main/views/advancedtable');
var DescriptorTypeView = require('../views/descriptortype');

var View = AdvancedTable.extend({
    template: require("../templates/descriptortypelist.html"),
    className: "object descriptor-type-list advanced-table-container",
    childView: DescriptorTypeView,
    childViewContainer: 'tbody.descriptor-type-list',

    initialize: function() {
        View.__super__.initialize.apply(this);

        this.listenTo(this.collection, 'reset', this.render, this);
        //this.listenTo(this.collection, 'add', this.render, this);
        //this.listenTo(this.collection, 'remove', this.render, this);
    }
});

module.exports = View;
