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

    attributes: {
        draggable: true,
    },

    ui: {
        'label': 'td[name="label"]',
        'mandatory': 'td[name="mandatory"]',
        'set_once': 'td[name="set_once"]',
    },

    events: {
        'dragstart': 'dragStart',
        'dragend': 'dragEnd',
        'dragover': 'dragOver',
        'dragenter': 'dragEnter',
        'dragleave': 'dragLeave',
        'drop': 'drop',
        'click @ui.label': 'editLabel',
        'click @ui.mandatory': 'toggleMandatory',
        'click @ui.set_once': 'toggleSetOnce',
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
        this.$el.css('background', '#ddd');
    },

    dragLeave: function (e) {
        this.$el.css('background', 'initial');
    },

    drop: function (e) {
        var elt = application.dndElement;

        if (elt.$el.hasClass('descriptor-type')) {
            alert("5 - descriptor-type");
        }
        else if (elt.$el.hasClass('descriptor-model-type')) {
            var newPosition = this.model.get('position');
            var modelId = this.model.collection.model_id;
            var collection = this.model.collection;

            $.ajax({
                type: "PUT",
                url: application.baseUrl + 'accession/descriptor/model/' + modelId + '/order/',
                dataType: 'json',
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify({
                    descriptor_model_type_id: elt.model.get('id'),
                    position: newPosition
                })
            }).done(function() {
                collection.fetch({update: true, remove: true, reset: true});
            }).fail(function () {
                $.alert.error(gt.gettext('Unable to reorder the types of models of descriptors'));
            })
        }
    },

    editLabel: function() {
        alert("todo edit label");
    },

    toggleMandatory: function() {
        // @todo cannot change from mandatory to optional once there is
        // some objects
        alert("todo edit mandatory");
    },

    toggleSetOnce: function() {
        alert("todo edit set_once");
    },
});

module.exports = View;
