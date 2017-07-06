/**
 * @file descriptormodelalt.js
 * @brief Alternative model of descriptor item view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-10-26
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Marionette = require('backbone.marionette');
var DescriptorModelModel = require('../models/descriptormodel');

var View = Marionette.View.extend({
    tagName: 'tr',
    className: 'element object descriptor-model',
    template: require('../templates/descriptormodelalt.html'),

    attributes: {
        draggable: true,
    },

    events: {
        'dragstart': 'dragStart',
        'dragend': 'dragEnd',
    },

    initialize: function() {
        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {
    },

    dragStart: function(e) {
        // fix for firefox...
        e.originalEvent.dataTransfer.setData('text/plain', null);

        this.$el.css('opacity', '0.4');
        application.main.dndElement = this;
    },

    dragEnd: function(e) {
        this.$el.css('opacity', '1.0');
        application.main.dndElement = null;
    },
});

module.exports = View;
