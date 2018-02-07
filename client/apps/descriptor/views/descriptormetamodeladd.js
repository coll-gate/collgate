/**
 * @file descriptormetamodeladd.js
 * @brief Add a layout of descriptor
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-10-26
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let Marionette = require('backbone.marionette');
let Dialog = require('../../main/views/dialog');

let View = Marionette.View.extend({
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
        let DescriptorModelCreate = Dialog.extend({
           template: require('../templates/descriptormetamodelcreate.html'),

            attributes: {
                id: "dlg_create_descriptor_model",
            },

            ui: {
                label: "#label",
                layout_target: "#layout_target",
                description: "#layout_description",
            },

            events: {
                'input @ui.label': 'onLabelInput',
            },

            initialize: function(options) {
                DescriptorModelCreate.__super__.initialize.apply(this);
            },

            onRender: function() {
                DescriptorModelCreate.__super__.onRender.apply(this);
                application.descriptor.views.describables.drawSelect(this.ui.layout_target);
            },

            onBeforeDestroy: function() {
                $(this.ui.layout_target).selectpicker('destroy');

                DescriptorModelCreate.__super__.onBeforeDestroy.apply(this);
            },

            onApply: function() {
                if (!this.validateLabel()) {
                    return;
                }

                let view = this;
                let collection = this.getOption('collection');
                let name = this.getOption('name');
                let label = this.ui.label.val();
                let target = this.ui.layout_target.val();
                let description = this.ui.description.val();

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
                            $.alert.error(_t("Unable to create the layout of descriptor !"));
                        }
                    });
                }
            },

            validateLabel: function() {
                let v = this.ui.label.val();

                if (v.length < 3) {
                    $(this.ui.label).validateField('failed', _t('characters_min', {count: 3}));
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
            let descriptorModelCreate = new DescriptorModelCreate({
                collection: this.collection,
                name: this.ui.name.val()
            });

            $(this.ui.name).cleanField();
            descriptorModelCreate.render();
        }
    },

    validateName: function() {
        let v = this.ui.name.val();
        let re = /^[a-zA-Z0-9_\-]+$/i;

        if (v.length > 0 && !re.test(v)) {
            $(this.ui.name).validateField('failed', _t("Invalid characters (alphanumeric, _ and - only)"));
            return false;
        } else if (v.length < 3) {
            $(this.ui.name).validateField('failed', _t('characters_min', {count: 3}));
            return false;
        }

        return true;
    },

    onNameInput: function () {
        if (this.validateName()) {
            $.ajax({
                type: "GET",
                url: window.application.url(['descriptor', 'layout', 'search']),
                dataType: 'json',
                data: {filters: JSON.stringify({
                    method: 'ieq',
                    fields: 'name',
                    name: this.ui.name.val()})
                },
                el: this.ui.name,
                success: function(data) {
                    if (data.items.length > 0) {
                        for (let i in data.items) {
                            let t = data.items[i];

                            if (t.name.toUpperCase() === this.el.val().toUpperCase()) {
                                $(this.el).validateField('failed', _t('Descriptor layout name already in usage'));
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
