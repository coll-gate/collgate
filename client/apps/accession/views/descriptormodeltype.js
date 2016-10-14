/**
 * @file descriptortype.js
 * @brief Type of descriptor item view
 * @author Frederic SCHERMA
 * @date 2016-07-21
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var DescriptorModelTypeModel = require('../models/descriptormodeltype');

var View = Marionette.ItemView.extend({
    tagName: 'tr',
    className: 'element object descriptor-model-type',
    template: require('../templates/descriptormodeltype.html'),

    events: {
        'dragstart': 'dragStart',
        'dragend': 'dragEnd',
        'dragover': 'dragOver',
        'dragenter': 'dragEnter',
        'dragleave': 'dragLeave',
        'drop': 'drop',
    },
/*
    events: {
        'click @ui.delete_descriptor_type': 'deleteDescriptorType',
        'click @ui.view_descriptor_type': 'viewDescriptorType',
        'click @ui.view_descriptor_value': 'viewDescriptorValue'
    },
*/
    initialize: function() {
        this.listenTo(this.model, 'reset', this.render, this);
    },
/*
    onRender: function() {
        if (!this.model.get('can_delete') || !session.user.isSuperUser) {
            $(this.ui.delete_descriptor_type).hide();
        }
    },
*/
    dragStart: function(e) {
        this.$el.css('opacity', '0.4');
    },

    dragEnd: function(e) {
        this.$el.css('opacity', '1.0');
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
        if ($(e.target).hasClass('descriptor-type')) {
            alert("descriptor-type");
        }
        alert("drop here todo remove the element if class name is descriptor-type or descriptor-model-type changes its position");
    }
});

module.exports = View;
