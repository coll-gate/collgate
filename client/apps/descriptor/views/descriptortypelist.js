/**
 * @file descriptortypelist.js
 * @brief List of types of descriptors for a group view
 * @author Frederic SCHERMA
 * @date 2016-07-21
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var ScrollView = require('../../main/views/scroll');
var DescriptorTypeView = require('../views/descriptortype');

var View = ScrollView.extend({
    template: require("../templates/descriptortypelist.html"),
    className: "object descriptor-type-list advanced-table-container",
    childView: DescriptorTypeView,
    childViewContainer: 'tbody.descriptor-type-list',

    initialize: function() {
        this.listenTo(this.collection, 'reset', this.render, this);
        //this.listenTo(this.collection, 'add', this.render, this);
        //this.listenTo(this.collection, 'remove', this.render, this);

        View.__super__.initialize.apply(this);
    }
});

module.exports = View;
