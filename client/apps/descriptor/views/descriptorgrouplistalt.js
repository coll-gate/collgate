/**
 * @file descriptorgrouplistalt.js
 * @brief Alternative view of list of groups of types of descriptors
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-10-14
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var DescriptorGroupAltView = require('../views/descriptorgroupalt');
var ScrollView = require('../../main/views/scroll');

var View = ScrollView.extend({
    template: require("../templates/descriptorgrouplistalt.html"),
    className: "object descriptor-group-list advanced-table-container",
    childView: DescriptorGroupAltView,
    childViewContainer: 'tbody.descriptor-group-list',

    childViewOptions: function () {
        return {
            layout: this.getOption('layout')
        }
    },

    initialize: function(options) {
        View.__super__.initialize.apply(this);

        this.listenTo(this.collection, 'reset', this.render, this);
    }
});

module.exports = View;

