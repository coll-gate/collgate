/**
 * @file descriptormodellist.js
 * @brief List of model of descriptors view
 * @author Frederic SCHERMA
 * @date 2016-09-27
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var DescriptorModelView = require('../views/descriptormodel');
var ScrollView = require('../../main/views/scroll');

var View = ScrollView.extend({
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
