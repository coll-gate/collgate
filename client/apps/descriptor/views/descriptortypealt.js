/**
 * @file descriptortypealt.js
 * @brief Alternative type of descriptor item view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-10-14
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Marionette = require('backbone.marionette');

var View = Marionette.View.extend({
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
        this.listenTo(this.model, 'change', this.render, this);
    },

    dragStart: function(e) {
        // fix for firefox...
        e.originalEvent.dataTransfer.setData('text/plain', null);

        this.$el.css('opacity', '0.4');
        application.main.dnd.set(this, 'descriptor-type');
    },

    dragEnd: function(e) {
        this.$el.css('opacity', '1.0');
        application.main.dnd.unset();
    }
});

module.exports = View;
