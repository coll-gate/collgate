/**
 * @file descriptorgrouplist.js
 * @brief List of groups of types of descriptors view
 * @author Frederic SCHERMA
 * @date 2016-07-20
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var DescriptorGroupModel = require('../models/descriptorgroup');
var DescriptorGroupView = require('../views/descriptorgroup');
var ScrollView = require('../../main/views/scroll');

var View = ScrollView.extend({
    template: require("../templates/descriptorgrouplist.html"),
    childView: DescriptorGroupView,
    childViewContainer: 'tbody.descriptor-group-list',

    initialize: function() {
        this.listenTo(this.collection, 'reset', this.render, this);
        this.listenTo(this.collection, 'change', this.render, this);
        //this.listenTo(this.collection, 'add', this.render, this);
        //this.listenTo(this.collection, 'remove', this.render, this);

        View.__super__.initialize.apply(this);
    }
});

module.exports = View;
