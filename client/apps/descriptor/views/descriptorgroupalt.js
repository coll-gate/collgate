/**
 * @file descriptorgroupalt.js
 * @brief Alternative view for group of type of descriptor item
 * @author Frederic SCHERMA
 * @date 2016-10-14
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var DescriptorGroupModel = require('../models/descriptorgroup');

var DescriptorTypeCollection = require('../collections/descriptortype');
var DescriptorTypeListAltView = require('./descriptortypelistalt');
var ScrollingMoreView = require('../../main/views/scrollingmore');

var View = Marionette.ItemView.extend({
    tagName: 'tr',
    className: 'element object descriptor-group-alt',
    template: require('../templates/descriptorgroupalt.html'),

    events: {
        'click': 'viewDescriptorTypes'
    },

    initialize: function(options) {
        this.listenTo(this.model, 'reset', this.render, this);
    },

    onRender: function() {
    },

    viewDescriptorTypes: function() {
        var layout = this.getOption('layout');
        var collection = new DescriptorTypeCollection([], {group_id: this.model.id});

        collection.fetch().then(function () {
            var descriptorTypeListView = new DescriptorTypeListAltView({collection : collection});

            layout.getRegion('right-down-content').show(descriptorTypeListView);
            layout.getRegion('right-down-bottom').show(new ScrollingMoreView({targetView: descriptorTypeListView}));
        });
    },
});

module.exports = View;