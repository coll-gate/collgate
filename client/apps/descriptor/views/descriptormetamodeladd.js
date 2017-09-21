/**
 * @file descriptormetamodeladd.js
 * @brief Add a meta-model of descriptor
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-10-26
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Marionette = require('backbone.marionette');
var Dialog = require('../../main/views/dialog');

var View = Marionette.View.extend({
    tagName: 'div',
    className: 'descriptor-meta-model-add',
    template: require('../templates/descriptormetamodeladd.html'),

    ui: {
        add: 'span.add-descriptor-meta-model',
        name: 'input.descriptor-meta-model-name',
    },

    events: {
        'click @ui.add': 'addDescriptorMetaModel',
        'input @ui.name': 'onNameInput',
    },

    initialize: function(options) {
        options || (options = {});
        this.collection = options.collection;
    },

    addDescriptorMetaModel: function () {
        var DescriptorModelCreate = Dialog.extend({
           template: require('../templates/descriptormetamodelcreate.html'),

            attributes: {
                id: "dlg_create_descriptor_model",
            },

            ui: {
                label: "#label",
                descriptor_meta_model_target: "#descriptor_meta_model_target",
                description: "#descriptor_meta_model_description",
            },

            events: {
                'input @ui.label': 'onLabelInput',
            },

            initialize: function(options) {
                DescriptorModelCreate.__super__.initialize.apply(this);
            },

            onRender: function() {
                DescriptorModelCreate.__super__.onRender.apply(this);
                application.descriptor.views.describables.drawSelect(this.ui.descriptor_meta_model_target);
            },

            onBeforeDestroy: function() {
                $(this.ui.descriptor_meta_model_target).selectpicker('destroy');

                DescriptorModelCreate.__super__.onBeforeDestroy.apply(this);
            },

            onApply: function() {
                if (!this.validateLabel()) {
                    return;
                }

                var view = this;
                var collection = this.getOption('collection');
                var name = this.getOption('name');
                var label = this.ui.label.val();
                var target = this.ui.descriptor_meta_model_target.val();
                var description = this.ui.description.val();

                if (target != null) {
                    collection.create({
                        name: name,
                        label: label,
                        target: target,
                        description: description
                    }, {
                        wait: true,
                        success: function () {
                            view.destroy();
                        },
                        error: function () {
                            $.alert.error(gt.gettext("Unable to create the meta-model of descriptor !"));
                        }
                    });
                }
            },

            validateLabel: function() {
                var v = this.ui.label.val();

                if (v.length < 3) {
                    $(this.ui.label).validateField('failed', gt.ngettext('characters_min', 'characters_min', {count: 3}));
                    return false;
                }

                return true;
            },

            onLabelInput: function () {
                if (this.validateLabel()) {
                    $(this.ui.label).validateField('ok');
                }
            }
        });

        if (!this.ui.name.hasClass('invalid') && this.validateName()) {
            var descriptorModelCreate = new DescriptorModelCreate({
                collection: this.collection,
                name: this.ui.name.val()
            });

            $(this.ui.name).cleanField();
            descriptorModelCreate.render();
        }
    },

    validateName: function() {
        var v = this.ui.name.val();
        var re = /^[a-zA-Z0-9_\-]+$/i;

        if (v.length > 0 && !re.test(v)) {
            $(this.ui.name).validateField('failed', gt.gettext("Invalid characters (alphanumeric, _ and - only)"));
            return false;
        } else if (v.length < 3) {
            $(this.ui.name).validateField('failed', gt.ngettext('characters_min', 'characters_min', {count: 3}));
            return false;
        }

        return true;
    },

    onNameInput: function () {
        if (this.validateName()) {
            $.ajax({
                type: "GET",
                url: application.baseUrl + 'descriptor/meta-model/search/',
                dataType: 'json',
                data: {filters: JSON.stringify({
                    method: 'ieq',
                    fields: 'name',
                    name: this.ui.name.val()})
                },
                el: this.ui.name,
                success: function(data) {
                    if (data.items.length > 0) {
                        for (var i in data.items) {
                            var t = data.items[i];

                            if (t.name.toUpperCase() === this.el.val().toUpperCase()) {
                                $(this.el).validateField('failed', gt.gettext('Descriptor meta-model name already in usage'));
                                break;
                            }
                        }
                    } else {
                        $(this.el).validateField('ok');
                    }
                }
            });
        }
    }
});

module.exports = View;
