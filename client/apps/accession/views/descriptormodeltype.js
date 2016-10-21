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
var Dialog = require('../../main/views/dialog');
var DescriptorModelTypeModel = require('../models/descriptormodeltype');


var View = Marionette.ItemView.extend({
    tagName: 'tr',
    className: 'element object descriptor-model-type',
    template: require('../templates/descriptormodeltype.html'),

    attributes: {
        draggable: true,
    },

    ui: {
        'delete_descriptor_model_type': 'span.delete-descriptor-model-type',
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
        'click @ui.delete_descriptor_model_type': 'deleteDescriptorModelType',
        'click @ui.label': 'editLabel',
        'click @ui.mandatory': 'toggleMandatory',
        'click @ui.set_once': 'toggleSetOnce',
    },

    initialize: function() {
        this.listenTo(this.model, 'reset', this.render, this);
    },

    onRender: function() {
        if (!session.user.isStaff && !session.user.isSuperUser) {
            $(this.ui.delete_descriptor_model_type).hide();
        }
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
        if (e.originalEvent.preventDefault) {
            e.originalEvent.preventDefault();
        }

        //e.originalEvent.dataTransfer.dropEffect = 'move';
        return false;
    },

    dragEnter: function (e) {
        if (application.dndElement.$el.hasClass('descriptor-model-type')) {
            if (this.model.get('position') < application.dndElement.model.get('position')) {
                this.$el.css('border-top', '5px dashed #ddd');
            } else if (this.model.get('position') > application.dndElement.model.get('position')) {
                this.$el.css('border-bottom', '5px dashed #ddd');
            }
        } else if (application.dndElement.$el.hasClass('descriptor-type')) {
             this.$el.css('border-top', '5px dashed #ddd');
        }
    },

    dragLeave: function (e) {
        if (application.dndElement.$el.hasClass('descriptor-model-type')) {
            if (this.model.get('position') < application.dndElement.model.get('position')) {
                this.$el.css('border-top', 'initial');
            } else if (this.model.get('position') > application.dndElement.model.get('position')) {
                this.$el.css('border-bottom', 'initial');
            }
        } else if (application.dndElement.$el.hasClass('descriptor-type')) {
             this.$el.css('border-top', 'initial');
        }
    },

    drop: function (e) {
        var elt = application.dndElement;

        if (elt.$el.hasClass('descriptor-type')) {
            // reset borders
            this.$el.css('border-top', 'initial');
            this.$el.css('border-bottom', 'initial');

            // ajax call
            var newPosition = this.model.get('position');
            var modelId = this.model.collection.model_id;
            var collection = this.model.collection;

            this.model.collection.create({
                descriptor_type_code: application.dndElement.model.get('code'),
                label: 'test1',
                position: newPosition
            });
        }
        else if (elt.$el.hasClass('descriptor-model-type')) {
            // useless drop on himself
            if (this == application.dndElement) {
                return;
            }

            // reset borders
            this.$el.css('border-top', 'initial');
            this.$el.css('border-bottom', 'initial');

            // ajax call
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
                collection.fetch({update: true, remove: true});
            }).fail(function () {
                $.alert.error(gt.gettext('Unable to reorder the types of models of descriptors'));
            })
        }
    },

    editLabel: function() {
        var ChangeLabel = Dialog.extend({
            template: require('../templates/descriptormodeltypechangelabel.html'),

            attributes: {
                id: "dlg_change_label",
            },

            ui: {
                label: "#label",
            },

            events: {
                'input @ui.label': 'onLabelInput',
            },

            initialize: function (options) {
                ChangeLabel.__super__.initialize.apply(this);
            },

            onLabelInput: function () {
                this.validateLabel();
            },

            validateLabel: function() {
                var v = this.ui.label.val();

                if (v.length < 3) {
                    $(this.ui.label).validateField('failed', gt.gettext('3 characters min'));
                    return false;
                }

                return true;
            },

            onApply: function() {
                var view = this;
                var model = this.getOption('model');
                var modelId = this.getOption('modelId');
                var typeId = this.getOption('typeId');

                if (this.validateLabel()) {
                    model.save({label: this.ui.label.val()}, {
                        patch: true,
                        wait: true,
                        success: function() {
                            view.remove();
                            $.alert.success(gt.gettext("Successfully labeled !"));
                        },
                        error: function() {
                            $.alert.error(gt.gettext("Unable to change label !"));
                        }
                    });
                }
            },
        });

        var changeLabel = new ChangeLabel({
            model: this.model,
            modelId: this.model.collection.model_id,
            typeId: this.model.get('id')
        });

        changeLabel.render();
        changeLabel.ui.label.val(this.model.get('label'));
    },

    toggleMandatory: function() {
        // @todo cannot change from mandatory to optional once there is some objects
        this.model.save({mandatory: !this.model.get('mandatory')}, {patch: true, wait: true});
    },

    toggleSetOnce: function() {
        this.model.save({set_once: !this.model.get('set_once')}, {patch: true, wait: true});
    },

    deleteDescriptorModelType: function() {
        // @todo cannot delete if there is some data
        alert("todo edit delete");
    }
});

module.exports = View;
