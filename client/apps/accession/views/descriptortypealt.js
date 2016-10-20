/**
 * @file descriptortypealt.js
 * @brief Alternative type of descriptor item view
 * @author Frederic SCHERMA
 * @date 2016-10-14
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var DescriptorTypeModel = require('../models/descriptortype');

var View = Marionette.ItemView.extend({
    tagName: 'tr',
    className: 'element object descriptor-type',
    template: require('../templates/descriptortypealt.html'),

    attributes: {
        draggable: true,
    },

    events: {
        'dragstart': 'dragStart',
        'dragend': 'dragEnd',
    },

    initialize: function() {
        this.listenTo(this.model, 'reset', this.render, this);
    },

    dragStart: function(e) {
        this.$el.css('opacity', '0.4');
        application.dndElement = this;
    },

    dragEnd: function(e) {
        this.$el.css('opacity', '1.0');
        application.dndElement = null;
    },
});

module.exports = View;
