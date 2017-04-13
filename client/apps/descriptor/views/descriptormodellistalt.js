/**
 * @file descriptormodellistalt.js
 * @brief Alternative list of model of descriptors view
 * @author Frederic SCHERMA
 * @date 2016-10-26
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var DescriptorModelView = require('../views/descriptormodelalt');

var ScrollView = require('../../main/views/scroll');

var View = ScrollView.extend({
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
