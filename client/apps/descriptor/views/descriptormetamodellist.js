/**
 * @file descriptormetamodellist.js
 * @brief List of meta-model of descriptors view
 * @author Frederic SCHERMA
 * @date 2016-10-27
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var DescriptorMetaModelModel = require('../models/descriptormetamodel');
var DescriptorMetaModelView = require('../views/descriptormetamodel');

var ScrollView = require('../../main/views/scroll');

var View = ScrollView.extend({
    template: require("../templates/descriptormetamodellist.html"),
    childView: DescriptorMetaModelView,
    childViewContainer: 'tbody.descriptor-meta-model-list',

    initialize: function() {
        this.listenTo(this.collection, 'reset', this.render, this);

        View.__super__.initialize.apply(this);
    },
});

module.exports = View;
