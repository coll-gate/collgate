/**
 * @file descriptormetamodel.js
 * @brief Meta-model of descriptor item view
 * @author Frederic SCHERMA
 * @date 2016-10-27
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var Dialog = require('../../main/views/dialog');
var DescriptorMetaModelModel = require('../models/descriptormetamodel');

var View = Marionette.ItemView.extend({
    tagName: 'tr',
    className: 'element object descriptor-meta-model',
    template: require('../templates/descriptormetamodel.html'),

    ui: {
        delete_descriptor_meta_model: 'span.delete-descriptor-meta-model',
        change_descriptor_meta_model_label: 'td.change-descriptor-meta-model-label',
        view_descriptor_meta_model: 'td.view-descriptor-meta-model',
        view_descriptor_panels: 'td.view-descriptor-panels',
    },

    events: {
        'click @ui.delete_descriptor_meta_model': 'deleteDescriptorMetaModel',
        'click @ui.change_descriptor_meta_model_label': 'editLabel',
        'click @ui.view_descriptor_meta_model': 'viewDescriptorMetaModelDetails',
        'click @ui.view_descriptor_panels': 'viewDescriptorPanels',
    },

    initialize: function() {
        this.listenTo(this.model, 'reset', this.render, this);
    },

    onRender: function() {
        // localize content-type
        application.main.views.contentTypes.htmlFromValue(this.el);

        // TODO check with user permission
        /*if (!this.model.get('can_delete') || !session.user.isSuperUser) {
            $(this.ui.delete_descriptor_model).hide();
        }*/
    },

    viewDescriptorMetaModelDetails: function() {
        Backbone.history.navigate("app/accession/descriptor/meta-model/" + this.model.id + "/", {trigger: true});
    },

    viewDescriptorPanels: function() {
        Backbone.history.navigate("app/accession/descriptor/meta-model/" + this.model.id + "/panel/", {trigger: true});
    },

    deleteDescriptorMetaModel: function() {
        if (this.model.get('num_descriptors_models') == 0) {
            this.model.destroy({wait: true});
        }
    },

    editLabel: function() {
        var ChangeLabel = Dialog.extend({
            template: require('../templates/descriptormetamodelchangelabel.html'),

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

                $(this.ui.label).validateField('ok');

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
});

module.exports = View;
