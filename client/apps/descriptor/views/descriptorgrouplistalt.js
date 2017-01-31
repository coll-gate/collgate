/**
 * @file descriptorgrouplistalt.js
 * @brief Alternative view of list of groups of types of descriptors
 * @author Frederic SCHERMA
 * @date 2016-10-14
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var DescriptorGroupModel = require('../models/descriptorgroup');
var DescriptorGroupAltView = require('../views/descriptorgroupalt');

var ScrollView = require('../../main/views/scroll');

var View = ScrollView.extend({
    template: require("../templates/descriptorgrouplistalt.html"),
    childView: DescriptorGroupAltView,
    childViewContainer: 'tbody.descriptor-group-list',

    childViewOptions: function () {
        return {
            layout: this.getOption('layout'),
        }
    },

    initialize: function(options) {
        this.listenTo(this.collection, 'reset', this.render, this);
        //this.listenTo(this.collection, 'add', this.render, this);
        //this.listenTo(this.collection, 'remove', this.render, this);

        View.__super__.initialize.apply(this);
    }
});

module.exports = View;
