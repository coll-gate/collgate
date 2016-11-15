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
        Backbone.history.navigate("app/descriptor/meta-model/" + this.model.id + "/", {trigger: true});
    },

    viewDescriptorPanels: function() {
        Backbone.history.navigate("app/descriptor/meta-model/" + this.model.id + "/panel/", {trigger: true});
    },

    deleteDescriptorMetaModel: function() {
        if (this.model.get('num_descriptor_models') == 0) {
            this.model.destroy({wait: true});
        }
    },

    editLabel: function() {
        var model = this.model;

        $.ajax({
            type: "GET",
            url: this.model.url() + 'label/',
            dataType: 'json',
        }).done(function (data) {
            var labels = data;

            var ChangeLabel = Dialog.extend({
                template: require('../templates/descriptormetamodelchangelabel.html'),
                templateHelpers: function () {
                    return {
                        labels: labels,
                    };
                },

                attributes: {
                    id: "dlg_change_labels",
                },

                ui: {
                    label: "#descriptor_meta_model_labels input",
                },

                events: {
                    'input @ui.label': 'onLabelInput',
                },

                initialize: function (options) {
                    ChangeLabel.__super__.initialize.apply(this);
                },

                onLabelInput: function (e) {
                    this.validateLabel(e);
                },

                validateLabel: function (e) {
                    var v = $(e.target).val();

                    if (v.length > 64) {
                        $(this.ui.label).validateField('failed', gt.gettext('64 characters max'));
                        return false;
                    }

                    $(this.ui.label).validateField('ok');

                    return true;
                },

                validateLabels: function() {
                    $.each($(this.ui.label), function(i, label) {
                        var v = $(this).val();

                        if (v.length > 64) {
                            $(this).validateField('failed', gt.gettext('64 characters max'));
                            return false;
                        }
                    });

                    return true;
                },

                onApply: function () {
                    var view = this;
                    var model = this.getOption('model');

                    var labels = {};

                    $.each($(this.ui.label), function(i, label) {
                        var v = $(this).val();
                        labels[$(label).attr("language")] = v;
                    });

                    if (this.validateLabels()) {
                        $.ajax({
                            type: "PUT",
                            url: model.url() + "label/",
                            dataType: 'json',
                            contentType: "application/json; charset=utf-8",
                            data: JSON.stringify(labels)
                        }).done(function() {
                            // manually update the current context label
                            model.set('label', labels[session.language]);
                            $.alert.success(gt.gettext("Successfully labeled !"));
                        }).always(function() {
                            view.remove();
                        });
                    }
                },
            });

            var changeLabel = new ChangeLabel({model: model});
            changeLabel.render();
        });
    },
});

module.exports = View;
