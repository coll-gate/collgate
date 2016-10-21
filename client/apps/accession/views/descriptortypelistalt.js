/**
 * @file descriptortypelistalt.js
 * @brief Alternative list of types of descriptors for a group view
 * @author Frederic SCHERMA
 * @date 2016-10-14
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var ScrollView = require('../../main/views/scroll');

var DescriptorTypeModel = require('../models/descriptortype');
var DescriptorTypeAltView = require('../views/descriptortypealt');

var View = ScrollView.extend({
    template: require("../templates/descriptortypelistalt.html"),
    childView: DescriptorTypeAltView,
    childViewContainer: 'tbody.descriptor-type-list',

    ui: {
        'table': 'table.table',
    },

    events: {
    },

    initialize: function() {
        this.listenTo(this.collection, 'reset', this.render, this);
        this.listenTo(this.collection, 'change', this.render, this);
        //this.listenTo(this.collection, 'add', this.render, this);
        //this.listenTo(this.collection, 'remove', this.render, this);

        View.__super__.initialize.apply(this);
    },
});

module.exports = View;
