/**
 * @file descriptorgrouplist.js
 * @brief List of groups of types of descriptors view
 * @author Frederic SCHERMA
 * @date 2016-07-20
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var DescriptorGroupView = require('../views/descriptorgroup');
var ScrollView = require('../../main/views/scroll');

var View = ScrollView.extend({
    template: require("../templates/descriptorgrouplist.html"),
    className: "object descriptor-group-list advanced-table-container",
    childView: DescriptorGroupView,
    childViewContainer: 'tbody.descriptor-group-list',

    initialize: function() {
        View.__super__.initialize.apply(this);

        this.listenTo(this.collection, 'reset', this.render, this);
    }
});

module.exports = View;
