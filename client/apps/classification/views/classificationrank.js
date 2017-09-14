/**
 * @file classificationrank.js
 * @brief Classification rank item view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-09-13
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var Marionette = require('backbone.marionette');
var Dialog = require('../../main/views/dialog');

var View = Marionette.View.extend({
    tagName: 'tr',
    className: 'element object classification-rank actions',
    template: require('../templates/classificationrank.html'),

    templateContext: function () {
        return {
            classification: this.getOption('classification')
        }
    },

    behaviors: {
        ActionBtnEvents: {
            behaviorClass: require('../../main/behaviors/actionbuttonevents'),
            actions: {
                edit: {display: false},
                tag: {display: true, title: gt.gettext("Edit label"), event: 'onRenameClassificationRank'},
                manage: {display: true, event: 'viewClassificationEntry'},
                remove: {display: true, event: 'deleteClassificationRank'}
            }
        }
    },

    ui: {
        status_icon: 'td.lock-status',
        delete_btn: 'td.action.remove',
        edit_label_btn: 'td.action.edit-label',
        manage_btn: 'td.action.manage'
    },

    events: {
       // 'click @ui.delete_btn': 'deleteClassification',
       'click @ui.edit_label_btn': 'editLabel',
       'click @ui.manage_btn': 'viewClassificationEntry'
    },

    initialize: function (options) {
        View.__super__.initialize.apply(this, arguments);

        this.listenTo(this.model, 'change', this.render, this);
    },

    actionsProperties: function() {
        var properties = {
            tag: {disabled: false},
            remove: {disabled: false}
        };

        // @todo do we want can_modify/can_delete like for descriptor ?
        if (!this.getOption('classification').get('can_modify') || !session.user.isSuperUser || !session.user.isStaff) {
            properties.tag.disabled = true;
        }

        if (!this.getOption('classification').get('can_delete') || !session.user.isSuperUser || !session.user.isStaff) {
            properties.remove.disabled = true;
        }

        return properties;
    },

    viewClassificationEntry: function () {
        Backbone.history.navigate("app/classification/classification/" + this.model.id + "/classificationrank/entry/", {trigger: true});
        return false;
    },

    deleteClassificationRank: function () {
        /*if (this.model.get('num_classification_entries') === 0) {
            this.model.destroy({wait: true});
        } else {
            $.alert.error(gt.gettext("Some entries exists for this classification rank"));
        }*/
        return false;
    },

    editLabel: function() {
        var model = this.model;

        // @todo do we want can_modify/can_delete like for descriptor ?
        if (!this.getOption('classification').get('can_modify') || !session.user.isSuperUser || !session.user.isStaff) {
            return false;
        }

        $.ajax({
            type: "GET",
            url: this.model.url() + 'label/',
            dataType: 'json'
        }).done(function (data) {
            var labels = data;

            var ChangeLabel = Dialog.extend({
                template: require('../templates/classificationchangelabel.html'),
                templateContext: function () {
                    return {
                        labels: labels
                    };
                },

                attributes: {
                    id: "dlg_change_labels"
                },

                ui: {
                    label: "form.entity-labels input"
                },

                events: {
                    'input @ui.label': 'onLabelInput'
                },

                initialize: function (options) {
                    ChangeLabel.__super__.initialize.apply(this);
                },

                onLabelInput: function (e) {
                    this.validateLabel(e);
                },

                validateLabel: function (e) {
                    var v = $(e.target).val();

                    if (v.length < 3) {
                        $(e.target).validateField('failed', gt.gettext('3 characters min'));
                        return false;
                    } else if (v.length > 128) {
                        $(e.target).validateField('failed', gt.gettext('128 characters max'));
                        return false;
                    }

                    $(e.target).validateField('ok');

                    return true;
                },

                validateLabels: function () {
                    $.each($(this.ui.label), function (i, label) {
                        var v = $(this).val();

                        if (v.length < 3) {
                            $(this).validateField('failed', gt.gettext('3 characters min'));
                            return false;
                        } else if (v.length > 128) {
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

                    $.each($(this.ui.label), function (i, label) {
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
                        }).done(function () {
                            // manually update the current context label
                            model.set('label', labels[session.language]);
                            $.alert.success(gt.gettext("Successfully labeled !"));
                        }).always(function () {
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
