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

    ui: {
    },

    events: {
        'dragstart': 'dragStart',
        'dragend': 'dragEnd',
        'dragover': 'dragOver',
        'dragenter': 'dragEnter',
        'dragleave': 'dragLeave',
        'drop': 'drop'
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
    
    dragOver: function (e) {
        if (e.preventDefault) {
            e.preventDefault();
        }

        //e.dataTransfer.dropEffect = 'move';
        return false;
    },

    dragEnter: function (e) {
        this.$el.addClass('draggable-over');
    },

    dragLeave: function (e) {
        this.$el.removeClass('draggable-over');
    },

    drop: function (e) {
        alert("drop here todo remove the element if class name is descriptor-model-type");
    }
});

module.exports = View;
