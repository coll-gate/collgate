/**
 * @file language.js
 * @brief Data language item view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-06-06
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var Marionette = require('backbone.marionette');
var Dialog = require('../../main/views/dialog');

var View = Marionette.View.extend({
    tagName: 'tr',
    className: 'element object language',
    template: require('../templates/language.html'),

    ui: {
        delete_language: 'span.delete-language',
        change_label: 'td.change-label'
    },

    events: {
        'click @ui.delete_language': 'deleteLanguage',
        'click @ui.change_label': 'onEditLabel'
    },

    behaviors: {
        ActionBtnEvents: {
            behaviorClass: require('../../main/behaviors/actionbuttonevents'),
            actions: {
                edit: {display: false},
                tag: {display: true, event: 'onEditLabel'},
                remove: {display: true, event: 'deleteLanguage'}
            }
        }
    },

    initialize: function() {
        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {
        // if ($.inArray("auth.delete_language", this.model.perms) < 0) {
        //     $(this.ui.delete_language).remove();
        // }
    },

    deleteLanguage: function () {
        this.model.destroy({wait: true});
    },

    onEditLabel: function(e) {
        var model = this.model;

        $.ajax({
            type: "GET",
            url: this.model.url() + 'label/',
            dataType: 'json',
        }).done(function (data) {
            var labels = data;

            var ChangeLabel = Dialog.extend({
                template: require('../templates/languagechangelabel.html'),
                templateContext: function () {
                    return {
                        labels: labels,
                    };
                },

                attributes: {
                    id: "dlg_change_labels",
                },

                ui: {
                    label: "#language_labels input",
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

                    if (v.length > 128) {
                        this.ui.label.validateField('failed', gt.gettext('128 characters max'));
                        return false;
                    }

                    this.ui.label.validateField('ok');

                    return true;
                },

                validateLabels: function() {
                    $.each(this.ui.label, function(i, label) {
                        var v = $(this).val();

                        if (v.length > 128) {
                            $(this).validateField('failed', gt.gettext('128 characters max'));
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
                            view.destroy();
                        });
                    }
                }
            });

            var changeLabel = new ChangeLabel({model: model});
            changeLabel.render();
        });
    }
});

module.exports = View;
