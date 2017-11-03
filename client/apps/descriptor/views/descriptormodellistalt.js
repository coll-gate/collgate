/**
 * @file descriptormodellistalt.js
 * @brief Alternative list of model of descriptors view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-10-26
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let Marionette = require('backbone.marionette');
let DescriptorModelView = require('../views/descriptormodelalt');

let AdvancedTable = require('../../main/views/advancedtable');

let View = AdvancedTable.extend({
    template: require("../templates/descriptormodellistalt.html"),
    className: "object descriptor-model-list advanced-table-container",
    childView: DescriptorModelView,
    childViewContainer: 'tbody.descriptor-model-list',

    initialize: function() {
        View.__super__.initialize.apply(this);

        this.listenTo(this.collection, 'reset', this.render, this);
    }
});

module.exports = View;

