/**
 * @file descriptormetamodellist.js
 * @brief List of meta-model of descriptors view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-10-27
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var DescriptorMetaModelView = require('../views/descriptormetamodel');
var ScrollView = require('../../main/views/scroll');

var View = ScrollView.extend({
    template: require("../templates/descriptormetamodellist.html"),
    className: "object descriptor-meta-model-list advanced-table-container",
    childView: DescriptorMetaModelView,
    childViewContainer: 'tbody.descriptor-meta-model-list',

    initialize: function() {
        View.__super__.initialize.apply(this);

        this.listenTo(this.collection, 'reset', this.render, this);
    }
});

module.exports = View;

