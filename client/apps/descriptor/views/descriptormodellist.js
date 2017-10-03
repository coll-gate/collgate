/**
 * @file descriptormodellist.js
 * @brief List of model of descriptors view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-09-27
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var DescriptorModelView = require('../views/descriptormodel');
var AdvancedTable = require('../../main/views/advancedtable');

var View = AdvancedTable.extend({
    template: require("../templates/descriptormodellist.html"),
    className: "object descriptor-model-list advanced-table-container",
    childView: DescriptorModelView,
    childViewContainer: 'tbody.descriptor-model-list',

    initialize: function() {
        View.__super__.initialize.apply(this);

        this.listenTo(this.collection, 'reset', this.render, this);
    }
});

module.exports = View;

