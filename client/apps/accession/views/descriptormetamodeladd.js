/**
 * @file descriptormetamodeladd.js
 * @brief Add a meta-model of descriptor
 * @author Frederic SCHERMA
 * @date 2016-10-26
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var Dialog = require('../../main/views/dialog');

var View = Marionette.ItemView.extend({
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
           template: require('../templates/descriptormodelcreate.html'),

            attributes: {
                id: "dlg_create_descriptor_model",
            },

            ui: {
                descriptor_meta_model_target: "#descriptor_meta_model_target",
                description: "#description",
            },

            initialize: function(options) {
                DescriptorModelCreate.__super__.initialize.apply(this);

                $(this.ui.descriptor_meta_model_target).select2({
                    dropdownParent: $(this.el),
                });
            },

            onApply: function() {
                var view = this;
                var collection = this.getOption('collection');
                var name = this.getOption('name');
                var target = this.ui.descriptor_meta_model_target.val();
                var description = this.ui.description.val();

                if (target != null) {
                    collection.create({
                        name: name,
                        label: '',
                        target: target,
                        description: description
                    }, {
                        wait: true,
                        success: function () {
                            view.remove();
                        },
                        error: function () {
                            $.alert.error(gt.gettext("Unable to create the meta-model of descriptor !"));
                        }
                    });
                }
            },
        });

        if (this.validateName()) {
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
            $(this.ui.name).validateField('failed', gt.gettext('3 characters min'));
            return false;
        }

        return true;
    },

    onNameInput: function () {
        if (this.validateName()) {
            $.ajax({
                type: "GET",
                url: application.baseUrl + 'accession/descriptor/meta-model/search/',
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

                            if (t.name.toUpperCase() == this.el.val().toUpperCase()) {
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
    },
});

module.exports = View;
